import { PropsWithChildren } from "react";
import BottomNav from "./BottomNav";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function LoggedInLayout({ children }: PropsWithChildren) {
  const { user, loggedIn, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="container h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Praxis Logo" className="h-7 w-7 rounded-lg" />
            <span className="font-heading">Praxis</span>
          </Link>
          <div className="flex items-center gap-3">
            {loggedIn && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-white/80">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-praxis-purple to-praxis-blue" />
                  <span>{user?.displayName || user?.email}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    import("sonner").then(({ toast }) => toast.success("Logged out"));
                    nav("/");
                  }}
                  className="btn-secondary px-3 py-1.5"
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
