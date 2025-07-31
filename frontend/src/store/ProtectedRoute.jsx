import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, redirectTo = "/login" }) {
  const location = useLocation();
  // Check both user and access token in sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user"));
  const access = sessionStorage.getItem("access");

  if (!user && !access) {
    // Capture the current location and pass it as a query parameter
    const currentPath = location.pathname + location.search;
    const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
    return <Navigate to={loginUrl} replace />;
  }

  // If using as a wrapper for nested routes:
  if (!children) return <Outlet />;
  // If using as a wrapper for a single component:
  return children;
}
