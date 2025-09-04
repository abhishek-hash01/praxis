export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-sm text-white/70">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Praxis Logo" className="h-8 w-8 rounded-xl" />
          <div>
            <p className="font-heading text-white">Praxis</p>
            <p className="text-xs">Trade skills. Build community.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto">
          <div className="space-y-2">
            <p className="text-white">Product</p>
            <a className="hover:text-white" href="#features">Features</a>
            <a className="hover:text-white" href="#how">How it works</a>
          </div>
          <div className="space-y-2">
            <p className="text-white">Company</p>
            <a className="hover:text-white" href="#">About</a>
            <a className="hover:text-white" href="#">Careers</a>
          </div>
          <div className="space-y-2">
            <p className="text-white">Legal</p>
            <a className="hover:text-white" href="#">Privacy</a>
            <a className="hover:text-white" href="#">Terms</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">© {new Date().getFullYear()} Praxis</div>
    </footer>
  );
}
