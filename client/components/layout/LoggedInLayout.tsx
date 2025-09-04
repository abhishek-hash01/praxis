import { PropsWithChildren } from "react";
import BottomNav from "./BottomNav";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function LoggedInLayout({ children }: PropsWithChildren) {
  const { user, loggedIn, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen pb-20 sm:pb-24">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="container h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4">
          <Link to="/dashboard" className="flex items-center gap-2 mobile-tap">
            <img src="/logo.png" alt="Praxis Logo" className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg" />
            <span className="font-heading text-sm sm:text-base">Praxis</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {loggedIn && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-white/80">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-praxis-purple to-praxis-blue" />
                  <span className="truncate max-w-32">{user?.displayName || user?.email}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    import("sonner").then(({ toast }) => toast.success("Logged out"));
                    nav("/");
                  }}
                  className="btn-secondary px-2 py-1.5 sm:px-3 text-xs sm:text-sm mobile-tap"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {children}
      <BottomNav />
    </div>
  );
}
