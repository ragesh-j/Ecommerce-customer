import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as cartService from "../services/cartService";

type CartItem = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    price: number;
    stock: number;
    product: {
      name: string;
      slug: string;
      media: { url: string }[];
    };
  };
};

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartService.getCart,
  });

  const { mutate: updateItem } = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateCartItem(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const { mutate: removeItem } = useMutation({
    mutationFn: cartService.removeCartItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const { mutate: clearCart } = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items: CartItem[] = cart?.items || [];
  const total = cart?.total || 0;

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 text-gray-300">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-400 mb-6">Add some products to get started</p>
        <Link
          to="/products"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">
          Cart ({items.length} {items.length === 1 ? "item" : "items"})
        </h1>
        <button
          onClick={() => clearCart()}
          className="text-sm text-red-500 hover:underline"
        >
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* items */}
        <div className="md:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">

              {/* image */}
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {item.variant.product.media[0] ? (
                  <img
                    src={item.variant.product.media[0].url}
                    alt={item.variant.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    No img
                  </div>
                )}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.variant.product.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{item.variant.name}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  ₹{Number(item.variant.price).toLocaleString()}
                </p>
              </div>

              {/* quantity + remove - stacked on mobile */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => {
                      if (item.quantity === 1) {
                        removeItem(item.id);
                      } else {
                        updateItem({ itemId: item.id, quantity: item.quantity - 1 });
                      }
                    }}
                    className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 rounded-l-lg transition-colors"
                  >
                    −
                  </button>
                  <span className="px-2.5 py-1.5 text-sm font-medium border-x border-gray-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateItem({ itemId: item.id, quantity: item.quantity + 1 })}
                    className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 rounded-r-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{(Number(item.variant.price) * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* summary */}
        <div className="md:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:sticky md:top-20">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Order summary</h2>

            <div className="space-y-2 mb-4">
              {items.map((item) => (
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
              onClick={() => navigate("/checkout")}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Proceed to checkout
            </button>

            <Link
              to="/products"
              className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;