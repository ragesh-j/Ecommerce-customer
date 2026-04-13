import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as orderService from "../services/orderService";
import * as productService from "../services/productService";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  variant: {
    name: string;
    sku: string;
    product: { id: string; name: string; slug: string };
  };
};

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  address: { line1: string; city: string; country: string };
  items: OrderItem[];
  payment?: { status: string; provider: string };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  PAID: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-500",
};

const Orders = () => {
  const [searchParams] = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    productId: string;
    productName: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const success = searchParams.get("success");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["myOrders"],
    queryFn: orderService.getMyOrders,
  });

  const { mutate: cancelOrder } = useMutation({
    mutationFn: orderService.cancelOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myOrders"] }),
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ["myReviews"],
    queryFn: productService.getMyReviews,
  });

  const reviewedProductIds = myReviews.map((r: any) => r.product.slug);

  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: () => productService.createReview(reviewModal!.productId, {
      rating: reviewRating,
      body: reviewBody || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myReviews"] });
      setReviewModal(null);
      setReviewBody("");
      setReviewRating(5);
      setReviewError(null);
    },
    onError: (err: any) => {
      setReviewError(err.response?.data?.message || "Failed to submit review");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-600 shrink-0">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">Order placed successfully!</p>
            <p className="text-xs text-green-600 mt-0.5">Your payment was confirmed and order is being processed.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">My orders</h1>
        <p className="text-sm text-gray-500">{orders.length} orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 text-gray-300">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <p className="text-gray-400 text-sm mb-4">No orders yet</p>
          <Link
            to="/products"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">

              {/* order header */}
              <div
                className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{Number(order.totalAmount).toLocaleString()}
                  </p>
                  {/* full status on larger screens */}
                  <span className={`hidden sm:inline px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500"}`}>
                    {order.status}
                  </span>
                  {/* abbreviated on mobile */}
                  <span className={`sm:hidden px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500"}`}>
                    {order.status.slice(0, 4)}
                  </span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    className={`text-gray-400 transition-transform shrink-0 ${expandedId === order.id ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* expanded */}
              {expandedId === order.id && (
                <div className="border-t border-gray-100 p-3 md:p-4">

                  {/* items */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Items</p>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{item.variant.product.name}</p>
                            <p className="text-xs text-gray-400">{item.variant.name} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-gray-900">
                              ₹{(Number(item.unitPrice) * item.quantity).toLocaleString()}
                            </p>
                            {order.status === "DELIVERED" && (
                              reviewedProductIds.includes(item.variant.product.slug) ? (
                                <span className="px-2.5 py-1 text-xs text-green-600 bg-green-50 rounded-lg shrink-0">
                                  Reviewed ✓
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReviewModal({
                                      productId: item.variant.product.id,
                                      productName: item.variant.product.name,
                                    });
                                    setReviewRating(5);
                                    setReviewBody("");
                                    setReviewError(null);
                                  }}
                                  className="px-2.5 py-1 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                                >
                                  Review
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* address */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Delivery address</p>
                    <p className="text-sm text-gray-700">
                      {order.address.line1}, {order.address.city}, {order.address.country}
                    </p>
                  </div>

                  {/* payment */}
                  {order.payment && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Payment</p>
                      <p className="text-sm text-gray-700 capitalize">
                        {order.payment.provider} — {order.payment.status}
                      </p>
                    </div>
                  )}

                  {/* cancel button */}
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => {
                        if (confirm("Cancel this order?")) cancelOrder(order.id);
                      }}
                      className="px-3 py-1.5 text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cancel order
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 md:p-6 w-full max-w-md">
            <h2 className="text-sm font-medium text-gray-900 mb-1">Write a review</h2>
            <p className="text-xs text-gray-400 mb-4">{reviewModal.productName}</p>

            {reviewError && (
              <p className="text-sm text-red-600 mb-3">{reviewError}</p>
            )}

            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill={star <= reviewRating ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              ))}
            </div>

            <textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setReviewModal(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => submitReview()}
                disabled={isSubmittingReview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isSubmittingReview ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;