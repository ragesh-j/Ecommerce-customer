import api from "./axios";

export const getMyOrders = async () => {
  const res = await api.get("/orders");
  return res.data.data.orders;
};

export const getOrderById = async (id: string) => {
  const res = await api.get(`/orders/${id}`);
  return res.data.data.order;
};
export const cancelOrder = async (id: string) => {
  const res = await api.patch(`/orders/${id}/cancel`);
  return res.data.data.order;
};


