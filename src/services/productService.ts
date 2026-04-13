import api from "./axios";

export const getProducts = async (params?: {
  search?: string;
  categoryId?: string;
  featured?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  const res = await api.get("/products", { params });
  return res.data.data;
};

export const getProductBySlug = async (slug: string) => {
  const res = await api.get(`/products/${slug}`);
  return res.data.data.product;
};


export const getProductReviews = async (productId: string) => {
  const res = await api.get(`/reviews/products/${productId}`);
  return res.data.data;
};

export const createReview = async (productId: string, data: { rating: number; body?: string }) => {
  const res = await api.post(`/reviews/products/${productId}`, data);
  return res.data.data.review;
};
export const getMyReviews = async () => {
  const res = await api.get("/users/me/reviews");
  return res.data.data.reviews;
};