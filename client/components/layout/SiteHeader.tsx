import { Link, useLocation } from "react-router-dom";

export default function SiteHeader() {
  const { pathname } = useLocation();
  const isAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/chat") || pathname.startsWith("/profile") || pathname.startsWith("/settings");
  if (isAuth) return null;
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/20 border-b border-white/10">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Praxis Logo" className="h-8 w-8 rounded-xl shadow" />
          <span className="font-heading text-lg tracking-tight">Praxis</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#testimonials" className="hover:text-white">Testimonials</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="btn-secondary hidden sm:inline-flex">Log in</Link>
          <Link to="/auth" className="btn-primary">Get started</Link>
        </div>
      </div>
    </header>
  );
}
