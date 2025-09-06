import { useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  // If user is logged in, redirect to dashboard instead of showing 404
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center glass-card px-8 py-10">
        <h1 className="text-5xl font-heading font-bold mb-4">404</h1>
        <p className="text-lg text-white/80 mb-6">Oops! Page not found</p>
        <a href="/" className="btn-primary">Return to Home</a>
      </div>
    </div>
  );
};

export default NotFound;
