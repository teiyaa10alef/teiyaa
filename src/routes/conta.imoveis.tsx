import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Home, Eye, MessageCircle, Trash2, Plus } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  myPropertiesQuery,
  updateProperty,
  deleteProperty,
  formatPrice,
  KIND_LABELS,
  PROPERTY_STATUS_LABELS,
  PURPOSE_LABELS,
  type PropertyStatus,
} from "@/lib/properties-api";

export const Route = createFileRoute("/conta/imoveis")({
  head: () => ({
    meta: [
      { title: "Meus imóveis — teiyaa" },
      {
        name: "description",
        content: "Gerencie os imóveis que você anunciou: status, visualizações e contatos.",
      },
      { property: "og:title", content: "Meus imóveis — teiyaa" },
      { property: "og:description", content: "Painel dos seus anúncios de imóveis no teiyaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeusImoveisPage,
});

const STATUS_OPTIONS: PropertyStatus[] = ["active", "reserved", "rented", "sold", "paused"];

function MeusImoveisPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading } = useQuery(myPropertiesQuery(user?.id));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["my-properties"] });

  const handleStatus = async (id: string, status: PropertyStatus) => {
    try {
      await updateProperty(id, { status });
      await refresh();
    } catch {
      toast.error("Não consegui atualizar o status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty(id);
      await refresh();
      toast.success("Anúncio removido");
    } catch {
      toast.error("Não consegui remover o anúncio");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Meus imóveis</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Acompanhe seus anúncios e mude o status quando fechar negócio.
            </p>
          </div>
          <Link
            to="/imoveis/novo"
            className="shrink-0 px-4 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm shadow-brand inline-flex items-center gap-1.5"
          >
            <Plus className="size-4" /> Novo
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground text-sm">Carregando…</p>
        ) : properties.length === 0 ? (
          <div className="mt-6 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <Home className="size-10 mx-auto text-cat-imovel" />
            <h2 className="font-bold text-lg mt-3 mb-2">Você ainda não anunciou imóveis</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              Anuncie sua casa, kitnet ou quarto e fale direto com quem procura no bairro.
            </p>
            <Link
              to="/imoveis/novo"
              className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
            >
              Anunciar imóvel
            </Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {properties.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex gap-3 p-3">
                  <Link
                    to="/imoveis/$propertyId"
                    params={{ propertyId: p.id }}
                    className="size-20 shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center"
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Home className="size-6 text-muted-foreground" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {PURPOSE_LABELS[p.purpose]} · {KIND_LABELS[p.kind]}
                    </p>
                    <Link
                      to="/imoveis/$propertyId"
                      params={{ propertyId: p.id }}
                      className="block font-bold truncate"
                    >
                      {p.title}
                    </Link>
                    <p className="text-sm font-bold text-cat-imovel">{formatPrice(p)}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" /> {p.view_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="size-3.5" /> {p.whatsapp_click_count}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 pb-3">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatus(p.id, e.target.value as PropertyStatus)}
                    aria-label="Status do anúncio"
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-semibold"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {PROPERTY_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    aria-label="Remover anúncio"
                    className="size-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
