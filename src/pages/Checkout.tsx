import { useState, useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as userService from "../services/userService";
import * as paymentService from "../services/paymentService";
import * as cartService from "../services/cartService";

type Address = {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: addressData, refetch: refetchAddresses } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: userService.getAddresses,
  });

  const addresses: Address[] = addressData || [];

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.getCart,
  });

  const items = cart?.items || [];
  const total = cart?.total || 0;

  const defaultAddress = addresses.find((a: Address) => a.isDefault);
  const activeAddressId = selectedAddressId || defaultAddress?.id;

  const [addressError, addAddressAction, isAddingAddress] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await userService.addAddress({
          line1: formData.get("line1") as string,
          line2: (formData.get("line2") as string) || undefined,
          city: formData.get("city") as string,
          state: (formData.get("state") as string) || undefined,
          postalCode: formData.get("postalCode") as string,
          country: formData.get("country") as string,
          isDefault: formData.get("isDefault") === "on",
        });
        await refetchAddresses();
        setShowAddressForm(false);
        return null;
      } catch (err: any) {
        return err.response?.data?.message || "Failed to add address";
      }
    },
    null
  );

  const handlePlaceOrder = async () => {
    if (!activeAddressId) {
      setError("Please select a delivery address");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // initiate payment — no DB order created yet
      const payment = await paymentService.initiatePayment(activeAddressId);

      if (!window.Razorpay) {
        setError("Payment gateway not loaded. Please refresh the page.");
        setIsProcessing(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.razorpayOrderId,
        name: "Ecom",
        handler: async (response: any) => {
          try {
            // verify payment + create order in one step
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              addressId: activeAddressId,
            });
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            navigate("/orders?success=true");
          } catch {
            setError("Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            // nothing to clean up — no order was created
            setError("Payment cancelled.");
            setIsProcessing(false);
          },
        },
        prefill: {},
        theme: { color: "#2563eb" },
      });

      razorpay.open();
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* order summary — shows first on mobile */}
        <div className="md:col-span-1 order-1 md:order-2">
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:sticky md:top-20">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Order summary</h2>

            <div className="space-y-2 mb-4">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 truncate mr-2">
                    {item.variant.product.name} × {item.quantity}
                  </span>
                  <span className="text-gray-900 shrink-0">
                    ₹{(Number(item.variant.price) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Total</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{Number(total).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing || items.length === 0}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isProcessing ? "Processing..." : "Place order"}
            </button>
          </div>
        </div>

        {/* address — shows second on mobile */}
        <div className="md:col-span-2 space-y-4 order-2 md:order-1">

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-900">Delivery address</h2>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-sm text-blue-600 hover:underline"
              >
                {showAddressForm ? "Cancel" : "+ Add new"}
              </button>
            </div>

            {showAddressForm && (
              <form action={addAddressAction} className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
                {addressError && (
                  <p className="text-sm text-red-600">{addressError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address line 1</label>
                    <input
                      name="line1"
                      required
                      placeholder="123 Main St"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address line 2 (optional)</label>
                    <input
                      name="line2"
                      placeholder="Apartment, suite, etc."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                    <input
                      name="city"
                      required
                      placeholder="Mumbai"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                    <input
                      name="state"
                      placeholder="Maharashtra"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Postal code</label>
                    <input
                      name="postalCode"
                      required
                      placeholder="400001"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                    <input
                      name="country"
                      required
                      defaultValue="India"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="isDefault" className="rounded" />
                      <span className="text-sm text-gray-600">Set as default address</span>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAddingAddress}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isAddingAddress ? "Saving..." : "Save address"}
                </button>
              </form>
            )}

            {addresses.length === 0 && !showAddressForm ? (
              <p className="text-sm text-gray-400">No addresses saved. Add one above.</p>
            ) : (
              <div className="space-y-2">
                {addresses.map((address: Address) => (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                      activeAddressId === address.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-900">{address.line1}</p>
                        {address.line2 && <p className="text-xs text-gray-500">{address.line2}</p>}
                        <p className="text-xs text-gray-500">
                          {address.city}{address.state && `, ${address.state}`} — {address.postalCode}
                        </p>
                        <p className="text-xs text-gray-500">{address.country}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {address.isDefault && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                          activeAddressId === address.id
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;