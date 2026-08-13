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
  Bell,
  Home,

} from "lucide-react";

export const Route = createFileRoute("/conta/")({
  head: () => ({
    meta: [
      { title: "Minha conta — teiyaa" },
      {
        name: "description",
        content: "Gerencie seu perfil profissional, negócios, anúncios, bicos e mensagens.",
      },
      { property: "og:title", content: "Minha conta — teiyaa" },
      { property: "og:description", content: "Central da sua conta no teiyaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContaHub,
});

const ITEMS = [
  {
    to: "/conta/profissional",
    icon: Briefcase,
    label: "Perfil profissional",
    hint: "Profissão, serviços e portfólio",
    tone: "brand",
  },
  {
    to: "/conta/negocios",
    icon: Store,
    label: "Meus negócios",
    hint: "Comércio, horários e localização",
    tone: "brand",
  },
  {
    to: "/conta/mercado",
    icon: ShoppingBag,
    label: "Meus anúncios",
    hint: "Itens à venda e propostas",
    tone: "brand",
  },
  {
    to: "/conta/imoveis",
    icon: Home,
    label: "Meus imóveis",
    hint: "Casas e quartos para alugar ou vender",
    tone: "brand",
  },
  {
    to: "/conta/freelances",
    icon: Flame,
    label: "Meus bicos",
    hint: "Freelances publicados",
    tone: "freelance",
  },
  {
    to: "/conta/candidaturas",
    icon: ClipboardList,
    label: "Minhas candidaturas",
    hint: "Status dos bicos que você pediu",
    tone: "freelance",
  },
  {
    to: "/mensagens",
    icon: MessageCircle,
    label: "Mensagens",
    hint: "Conversas com vizinhos",
    tone: "brand",
  },
  {
    to: "/conta/notificacoes",
    icon: Bell,
    label: "Notificações",
    hint: "Propostas, candidaturas e avaliações",
    tone: "brand",
  },
] as const;


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
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Carregando…
        </main>
        <SiteFooter />
      </div>
    );
  }

  const name =
    (user.user_metadata as Record<string, string> | undefined)?.first_name ??
    user.email?.split("@")[0] ??
    "vizinho";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Olá, {name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Tudo da sua conta em um lugar.</p>

        <ul className="mt-5 rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {ITEMS.map(({ to, icon: Icon, label, hint, tone }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex items-center gap-3 px-3.5 py-3 hover:bg-surface transition-colors"
              >
                <span
                  className={`size-9 shrink-0 rounded-xl flex items-center justify-center ${
                    tone === "freelance"
                      ? "bg-cat-freelance-soft text-cat-freelance"
                      : "bg-brand-soft text-brand"
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold truncate">{label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{hint}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
