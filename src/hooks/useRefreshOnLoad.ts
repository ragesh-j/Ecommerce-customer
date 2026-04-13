import { useEffect, useState } from "react";
import { useAppDispatch } from "../app/hooks";
import { setCredentials, logout } from "../features/auth/authSlice";
import api from "../services/axios";

const useRefreshOnLoad = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await api.post("/auth/refresh");
        const user = res.data.data.user;
        if (user?.role !== "BUYER") {
          dispatch(logout());
          return;
        }
        dispatch(setCredentials({
          token: res.data.data.accessToken,
          user: res.data.data.user ?? null,
        }));
      } catch {
        dispatch(logout());
      } finally {
        setIsLoading(false);
      }
    };

    refresh();
  }, []);

  return { isLoading };
};

export default useRefreshOnLoad;