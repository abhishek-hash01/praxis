import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { currentUser } = useAuth();

  // If the user is not logged in, redirect them to the /auth page
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // If the user is logged in, show the page they were trying to access
  return <Outlet />;
};

export default ProtectedRoute;