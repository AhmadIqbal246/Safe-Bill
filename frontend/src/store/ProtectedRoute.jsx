import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ children, redirectTo = "/login" }) {
  // Check both user and access token in sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user"));
  const access = sessionStorage.getItem("access");

  if (!user && !access) {
    return <Navigate to={redirectTo} replace />;
  }

  // If using as a wrapper for nested routes:
  if (!children) return <Outlet />;
  // If using as a wrapper for a single component:
  return children;
}
