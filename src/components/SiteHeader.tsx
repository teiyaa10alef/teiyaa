import { Link } from "@tanstack/react-router";

const navItems = [
  { to: "/comercios", label: "Comércios" },
  { to: "/servicos", label: "Serviços" },
  { to: "/imoveis", label: "Imóveis" },
  { to: "/vagas", label: "Vagas" },
  { to: "/freelances", label: "Freelances" },
] as const;

export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-3xl font-bold tracking-tighter text-brand">
            teiyaa
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="hover:text-brand transition-colors"
                activeProps={{ className: "text-brand" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button className="px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors">
            Entrar
          </button>
          <button className="px-5 md:px-6 py-2.5 bg-brand text-primary-foreground rounded-full text-sm font-bold shadow-brand hover:bg-brand-dark transition-all">
            Anunciar
          </button>
        </div>
      </div>
    </nav>
  );
}
