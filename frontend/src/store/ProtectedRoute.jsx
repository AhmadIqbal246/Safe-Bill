import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, redirectTo = "/login", requiredRole }) {
  const location = useLocation();
  // Check both user and access token in sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user"));
  const access = sessionStorage.getItem("access");
  const adminRoleFlag = user?.is_admin;
  console.log("adminRoleFlag", adminRoleFlag);

  if (!user && !access) {
    // Capture the current location and pass it as a query parameter
    const currentPath = location.pathname + location.search;
    const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
    return <Navigate to={loginUrl} replace />;
  }

  // Role-based protection
  if (requiredRole) {
    // Added: prefer active_role from token/me for route guards; fallback to legacy role
    const userRole = user?.active_role || user?.role;
    let hasRequiredRole = false;

    // Handle both single role (string) and multiple roles (array)
    if (Array.isArray(requiredRole)) {
      hasRequiredRole = requiredRole.includes(userRole);
    } else {
      hasRequiredRole = userRole === requiredRole;
    }

    // Allow admin override when route requires admin/super-admin
    const routeRequiresAdmin = Array.isArray(requiredRole)
      ? (requiredRole.includes("admin") || requiredRole.includes("super-admin"))
      : (requiredRole === "admin" || requiredRole === "super-admin");

    if (!hasRequiredRole) {
      if (adminRoleFlag && routeRequiresAdmin) {
        // Allow access due to admin override flag in session storage
        if (!children) return <Outlet />;
        return children;
      }
      // Redirect to not-authorized page if user doesn't have the required role
      return <Navigate to="/not-authorized" replace />;
    }
  }

  // If using as a wrapper for nested routes:
  if (!children) return <Outlet />;
  // If using as a wrapper for a single component:
  return children;
}
