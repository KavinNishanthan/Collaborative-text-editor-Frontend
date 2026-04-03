// Importing Packages
import { Navigate, Outlet } from "react-router-dom";

// Importing Store
import { useAuthStore } from "../Store/useAuthStore";

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Outlet /> : <Navigate to='/login' replace />;
};

export const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to='/dashboard' replace /> : <Outlet />;
};
