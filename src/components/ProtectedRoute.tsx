import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

const ProtectedRoute = () => {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

    const location = useLocation();

  if (!token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user && user.role !== "BUYER") return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;