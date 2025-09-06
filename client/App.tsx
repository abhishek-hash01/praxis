import "./global.css";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Import Navigate
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat.tsx";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Connections from "./pages/Connections";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Update document title dynamically based on route
    const updateTitle = () => {
      const path = window.location.pathname;
      let title = "Praxis – Connect, Learn & Grow Through Skill Exchange";
      
      switch (path) {
        case "/":
          title = "Praxis – Connect, Learn & Grow Through Skill Exchange";
          break;
        case "/auth":
          title = "Sign In | Praxis";
          break;
        case "/dashboard":
          title = "Discover Skills | Praxis";
          break;
        case "/profile":
          title = "My Profile | Praxis";
          break;
        case "/chat":
          title = "Messages | Praxis";
          break;
        case "/connections":
          title = "My Connections | Praxis";
          break;
        case "/settings":
          title = "Settings | Praxis";
          break;
        default:
          if (path.startsWith("/chat/")) {
            title = "Chat | Praxis";
          }
      }
      
      document.title = title;
    };

    updateTitle();
    
    // Listen for route changes
    const handlePopState = () => updateTitle();
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />

              {/* --- Protected Routes Group --- */}
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:userId" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* --- Catch-all Not Found Route --- */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);