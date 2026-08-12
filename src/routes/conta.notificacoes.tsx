import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationVisual,
  notificationsQuery,
  timeAgoShort,
} from "@/lib/notifications-api";

export const Route = createFileRoute("/conta/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — teiyaa" },
      {
        name: "description",
        content: "Todas as novidades do seu comércio, anúncios, bicos e mensagens no bairro.",
      },
      { property: "og:title", content: "Notificações — teiyaa" },
      { property: "og:description", content: "Acompanhe tudo que acontece na sua conta teiyaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificacoesPage,
});

function NotificacoesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery(notificationsQuery(user?.id));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        <Link
          to="/conta"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Minha conta
        </Link>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Notificações</h1>
          {unread > 0 && user && (
            <button
              onClick={async () => {
                await markAllNotificationsRead(user.id);
                qc.invalidateQueries({ queryKey: ["notifications", user.id] });
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-4" /> Marcar todas como lidas
            </button>
          )}
        </div>

        {isLoading || loading ? (
          <p className="py-16 text-center text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          <div className="mt-8 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <Bell className="size-8 mx-auto text-muted-foreground" />
            <p className="mt-3 font-semibold">Nada por aqui ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você será avisado sobre propostas, candidaturas, avaliações e mensagens.
            </p>
          </div>
        ) : (
          <ul className="mt-5 rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {items.map((n) => {
              const v = notificationVisual(n.type);
              return (
                <li key={n.id}>
                  <button
                    onClick={async () => {
                      if (!n.read_at) {
                        await markNotificationRead(n.id);
                        qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
                      }
                      if (n.link_path) navigate({ to: n.link_path as never });
                    }}
                    className={`w-full text-left flex gap-3 px-3.5 py-3 hover:bg-surface transition-colors ${
                      n.read_at ? "" : "bg-brand-soft/40"
                    }`}
                  >
                    <span
                      className={`size-9 shrink-0 rounded-xl flex items-center justify-center ${v.tone}`}
                    >
                      {v.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold truncate">{n.title}</span>
                      {n.body && (
                        <span className="block text-xs text-muted-foreground truncate">{n.body}</span>
                      )}
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {timeAgoShort(n.created_at)}
                      </span>
                    </span>
                    {!n.read_at && <span className="mt-2 size-2 rounded-full bg-brand shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
