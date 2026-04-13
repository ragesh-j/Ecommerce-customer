import api from "./axios";

export const getActiveBanners = async () => {
  const res = await api.get("/banners");
  return res.data.data.banners;
};