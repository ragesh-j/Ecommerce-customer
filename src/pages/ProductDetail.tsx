import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "../app/hooks";
import * as productService from "../services/productService";
import * as cartService from "../services/cartService";

type Variant = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: { name: string; slug: string };
  seller: { id: string; storeName: string; logoUrl?: string; isVerified: boolean };
  variants: Variant[];
  media: { id: string; url: string }[];
  _count: { reviews: number };
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productService.getProductBySlug(slug!),
    enabled: !!slug,
  });

  const { data: reviewData } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: () => productService.getProductReviews(product!.id),
    enabled: !!product,
  });

  const reviews = reviewData?.reviews || [];
  const avgRating = reviewData?.avgRating || 0;
  const totalReviews = reviewData?.total || 0;

  const variant = selectedVariant || product?.variants[0];

  const { mutate: addToCartMutation } = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      cartService.addCartItem(variantId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to add to cart");
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      navigate("/login", { state: { from: `/products/${slug}` } });
      return;
    }
    if (!variant) return;
    addToCartMutation({ variantId: variant.id, quantity });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Product not found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 mb-4 md:mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <a href="/" className="hover:text-gray-600 shrink-0">Home</a>
        <span>/</span>
        <a href="/products" className="hover:text-gray-600 shrink-0">Products</a>
        <span>/</span>
        <a href={`/products?categoryId=${product.category.slug}`} className="hover:text-gray-600 shrink-0">
          {product.category.name}
        </a>
        <span>/</span>
        <span className="text-gray-900 truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">

        {/* images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
            {product.media[selectedImage] ? (
              <img
                src={product.media[selectedImage].url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                No image
              </div>
            )}
          </div>

          {product.media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.media.map((media: Product['media'][0], index: number) => (
                <button
                  key={media.id}
                  onClick={() => setSelectedImage(index)}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
                    selectedImage === index ? "border-blue-500" : "border-transparent"
                  }`}
                >
                  <img src={media.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* product info */}
        <div>
          <p className="text-xs text-blue-600 font-medium mb-2">{product.category.name}</p>
          <h1 className="text-xl md:text-2xl font-medium text-gray-900 mb-2">{product.name}</h1>

          <div className="flex items-center gap-2 mb-3 md:mb-4">
            {product.seller.logoUrl && (
              <img src={product.seller.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
            )}
            <span className="text-sm text-gray-500">by {product.seller.storeName}</span>
            {product.seller.isVerified && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                Verified
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3 md:mb-4">
            {avgRating > 0 && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill={star <= Math.round(avgRating) ? "#f59e0b" : "#e5e7eb"}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
                <span className="text-sm font-medium text-gray-700">{avgRating}</span>
              </div>
            )}
            <p className="text-sm text-gray-400">{totalReviews} reviews</p>
          </div>

          <p className="text-2xl md:text-3xl font-medium text-gray-900 mb-4 md:mb-6">
            ₹{Number(variant?.price).toLocaleString()}
          </p>

          {product.variants.length > 1 && (
            <div className="mb-4 md:mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Select variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: Variant) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.stock === 0}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      variant?.id === v.id
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : v.stock === 0
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {v.name}
                    {v.stock === 0 && " (Out of stock)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 md:mb-6">
            {variant && variant.stock > 0 ? (
              <p className="text-sm text-green-600">
                {variant.stock < 10 ? `Only ${variant.stock} left!` : "In stock"}
              </p>
            ) : (
              <p className="text-sm text-red-500">Out of stock</p>
            )}
          </div>

          {variant && variant.stock > 0 && (
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <p className="text-sm font-medium text-gray-700">Quantity</p>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-l-lg transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-1.5 text-sm font-medium border-x border-gray-200">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(variant.stock, quantity + 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-r-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!variant || variant.stock === 0}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
              addedToCart
                ? "bg-green-600 text-white"
                : variant && variant.stock > 0
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {addedToCart ? "Added to cart!" : variant && variant.stock === 0 ? "Out of stock" : "Add to cart"}
          </button>

          {product.description && (
            <div className="mt-6 md:mt-8 pt-6 border-t border-gray-100">
              <h2 className="text-sm font-medium text-gray-900 mb-2">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* reviews */}
      <div className="mt-10 md:mt-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-medium text-gray-900">Reviews</h2>
          <span className="text-sm text-gray-400">{totalReviews} reviews</span>
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    {review.user.avatarUrl ? (
                      <img src={review.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-blue-600">
                        {review.user.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{review.user.name || "Anonymous"}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill={star <= review.rating ? "#f59e0b" : "#e5e7eb"}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {review.body && (
                  <p className="text-sm text-gray-600">{review.body}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;