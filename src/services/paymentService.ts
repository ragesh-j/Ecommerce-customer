import api from "./axios";

export const initiatePayment = async (addressId: string) => {
  const res = await api.post("/payments/initiate", { addressId });
  return res.data.data;
};

export const verifyPayment = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  addressId: string;
}) => {
  const res = await api.post("/payments/verify", data);
  return res.data.data;
};