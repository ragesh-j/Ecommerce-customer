import api from "./axios";

export const getProfile = async () => {
  const res = await api.get("/users/me");
  return res.data.data.user;
};

export const updateProfile = async (data: { name?: string }) => {
  const res = await api.put("/users/me", data);
  return res.data.data.user;
};

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const res = await api.put("/users/me/password", data);
  return res.data;
};

export const setPassword = async (data: { newPassword: string }) => {
  const res = await api.post("/users/me/password", data);
  return res.data;
};

export const getAddresses = async () => {
  const res = await api.get("/users/me/addresses");
  return res.data.data.addresses;
};

export const addAddress = async (data: {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}) => {
  const res = await api.post("/users/me/addresses", data);
  return res.data.data.address;
};

export const deleteAddress = async (id: string) => {
  await api.delete(`/users/me/addresses/${id}`);
};