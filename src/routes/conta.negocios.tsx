import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { listMyBusinesses } from "@/lib/account-api";
import { ArrowLeft, Plus, Store } from "lucide-react";

export const Route = createFileRoute("/conta/negocios")({
  head: () => ({ meta: [{ title: "Meus negócios — teiyaa" }] }),
  component: NegociosList,
});

function NegociosList() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["my-businesses", user?.id],
    queryFn: () => listMyBusinesses(user!.id),
    enabled: !!user,
  });

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
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <Link to="/conta" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Minha conta
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Meus negócios</h1>
          <Link to="/conta/negocios/novo" className="inline-flex items-center gap-1 px-4 py-2 bg-brand text-primary-foreground rounded-full font-semibold text-sm">
            <Plus className="size-4" /> Novo
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Carregando…</p>
        ) : businesses.length === 0 ? (
          <div className="mt-12 text-center p-10 rounded-2xl border border-dashed border-border">
            <Store className="size-10 mx-auto text-muted-foreground" />
            <p className="mt-3 font-semibold">Nenhum negócio cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">Cadastre seu comércio para aparecer no feed do bairro.</p>
            <Link to="/conta/negocios/novo" className="mt-4 inline-block px-5 py-2.5 bg-brand text-primary-foreground rounded-full font-semibold text-sm">
              Cadastrar negócio
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {businesses.map((b) => (
              <li key={b.id}>
                <Link to="/conta/negocios/$businessId" params={{ businessId: b.id }} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:border-brand transition-colors">
                  <div className="size-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {b.logo_url ? <img src={b.logo_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Store className="size-6" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.is_published ? "Publicado" : "Rascunho"} · {b.category ?? "—"}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
