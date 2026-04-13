import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { setCredentials } from "../features/auth/authSlice";
import api from "../services/axios";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const exchange = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error || !code) {
        navigate("/login?error=google_failed");
        return;
      }

      try {
        const res = await api.post("/auth/oauth/exchange", { code });
        const { user, accessToken } = res.data.data;
        dispatch(setCredentials({ token: accessToken, user }));
        navigate("/");
      } catch {
        navigate("/login?error=google_failed");
      }
    };

    exchange();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default AuthCallback;