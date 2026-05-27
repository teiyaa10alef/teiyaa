import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { to: "/comercios", label: "Comércios" },
  { to: "/servicos", label: "Serviços" },
  { to: "/imoveis", label: "Imóveis" },
  { to: "/vagas", label: "Vagas" },
  { to: "/freelances", label: "Freelances" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta");
    navigate({ to: "/" });
    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl md:text-3xl font-bold tracking-tighter text-brand">
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
          {user ? (
            <>
              <Link
                to="/conta"
                className="hidden sm:inline-flex items-center gap-1 px-3 md:px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground"
              >
                <UserIcon className="size-4" /> Minha conta
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1 px-3 md:px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground"
              >
                <LogOut className="size-4" /> Sair
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex px-3 md:px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
          )}
          <Link
            to="/anunciar"
            className="hidden sm:inline-flex px-4 md:px-6 py-2.5 bg-brand text-primary-foreground rounded-full text-sm font-bold shadow-brand hover:bg-brand-dark transition-all"
          >
            Anunciar
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Abrir menu"
                className="md:hidden inline-flex items-center justify-center size-11 rounded-xl border border-border bg-surface text-foreground"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:max-w-sm">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold tracking-tighter text-brand text-left">
                  teiyaa
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="px-4 py-4 rounded-xl text-base font-semibold text-foreground hover:bg-muted transition-colors"
                    activeProps={{ className: "bg-brand-soft text-brand" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Conectado como <strong>{user.email}</strong>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full py-3 rounded-full border border-border font-semibold flex items-center justify-center gap-2"
                    >
                      <LogOut className="size-4" /> Sair
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="w-full py-3 rounded-full border border-border font-semibold text-center"
                  >
                    Entrar
                  </Link>
                )}
                <Link
                  to="/anunciar"
                  onClick={() => setOpen(false)}
                  className="w-full py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand text-center"
                >
                  Anunciar
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
