import api from "./axios";

export const getCart = async () => {
  const res = await api.get("/cart");
  return res.data.data.cart;
};

export const addCartItem = async (variantId: string, quantity: number) => {
  const res = await api.post("/cart/items", { variantId, quantity });
  return res.data.data.item;
};

export const updateCartItem = async (itemId: string, quantity: number) => {
  const res = await api.put(`/cart/items/${itemId}`, { quantity });
  return res.data.data.item;
};

export const removeCartItem = async (itemId: string) => {
  await api.delete(`/cart/items/${itemId}`);
};

export const clearCart = async () => {
  await api.delete("/cart");
};