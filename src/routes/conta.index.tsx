import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  Briefcase,
  Store,
  ChevronRight,
  ShoppingBag,
  MessageCircle,
  Flame,
  ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/conta/")({
  head: () => ({
    meta: [{ title: "Minha conta — teiyaa" }],
  }),
  component: ContaHub,
});

function ContaHub() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Carregando…</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-10 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Minha conta</h1>
        <p className="mt-2 text-muted-foreground">Ative seu perfil profissional ou cadastre seu negócio.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            to="/conta/profissional"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-brand transition-colors flex flex-col gap-3"
          >
            <div className="size-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <Briefcase className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sou profissional</h2>
              <p className="text-sm text-muted-foreground">
                Crie um perfil completo com profissão, serviços, fotos e portfólio.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-brand font-semibold text-sm">
              Gerenciar perfil <ChevronRight className="size-4" />
            </span>
          </Link>

          <Link
            to="/conta/negocios"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-brand transition-colors flex flex-col gap-3"
          >
            <div className="size-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <Store className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sou dono de negócio</h2>
              <p className="text-sm text-muted-foreground">
                Cadastre seu comércio com logo, horários, serviços, galeria e localização.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-brand font-semibold text-sm">
              Meus negócios <ChevronRight className="size-4" />
            </span>
          </Link>

          <Link
            to="/conta/mercado"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-brand transition-colors flex flex-col gap-3"
          >
            <div className="size-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Meus anúncios do mercado</h2>
              <p className="text-sm text-muted-foreground">
                Venda itens novos e usados para vizinhos e responda propostas.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-brand font-semibold text-sm">
              Gerenciar itens <ChevronRight className="size-4" />
            </span>
          </Link>

          <Link
            to="/conta/freelances"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-brand transition-colors flex flex-col gap-3"
          >
            <div className="size-12 rounded-xl bg-cat-freelance-soft text-cat-freelance flex items-center justify-center">
              <Flame className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Meus bicos</h2>
              <p className="text-sm text-muted-foreground">
                Publique freelances, compare candidatos e escolha quem vai te ajudar.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-brand font-semibold text-sm">
              Gerenciar bicos <ChevronRight className="size-4" />
            </span>
          </Link>

          <Link
            to="/conta/candidaturas"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-brand transition-colors flex flex-col gap-3"
          >
            <div className="size-12 rounded-xl bg-cat-freelance-soft text-cat-freelance flex items-center justify-center">
              <ClipboardList className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Minhas candidaturas</h2>
              <p className="text-sm text-muted-foreground">
                Acompanhe os bicos em que você se candidatou e o status de cada um.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-brand font-semibold text-sm">
              Ver candidaturas <ChevronRight className="size-4" />
            </span>
          </Link>

          <Link
            to="/mensagens"
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-brand transition-colors flex flex-col gap-3"
          >
            <div className="size-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
              <MessageCircle className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Mensagens</h2>
              <p className="text-sm text-muted-foreground">
                Converse com vizinhos sobre itens do mercado e bicos.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-brand font-semibold text-sm">
              Abrir conversas <ChevronRight className="size-4" />
            </span>
          </Link>

        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
