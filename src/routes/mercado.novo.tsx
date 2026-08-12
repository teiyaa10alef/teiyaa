import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { communitiesQuery } from "@/lib/listings-api";
import {
  MARKET_CATEGORIES,
  MARKET_CATEGORY_LABELS,
  CONDITION_LABELS,
  type MarketCondition,
} from "@/lib/market-api";
import { X } from "lucide-react";

export const Route = createFileRoute("/mercado/novo")({
  head: () => ({
    meta: [
      { title: "Anunciar item no mercado — teiyaa" },
      {
        name: "description",
        content: "Publique um item novo ou usado para vender aos vizinhos do seu bairro.",
      },
      { property: "og:title", content: "Anunciar item no mercado — teiyaa" },
      { property: "og:description", content: "Venda itens novos e usados no seu bairro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovoItemPage,
});

function NovoItemPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: communities = [] } = useQuery(communitiesQuery);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(true);
  const [condition, setCondition] = useState<MarketCondition>("usado");
  const [category, setCategory] = useState<string>("outros");
  const [communityId, setCommunityId] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!communityId && communities.length > 0) setCommunityId(communities[0]!.id);
  }, [communities, communityId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        urls.push(await uploadMedia(file, user.id, "market"));
      }
      setImages((prev) => [...prev, ...urls].slice(0, 6));
    } catch {
      toast.error("Não consegui enviar as fotos");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) return toast.error("Dê um título ao anúncio");
    setSaving(true);
    const cents = price ? Math.round(Number(price.replace(",", ".")) * 100) : null;
    const { data, error } = await supabase
      .from("market_items")
      .insert({
        seller_id: user.id,
        community_id: communityId || null,
        title: title.trim(),
        description: description.trim(),
        price_cents: Number.isFinite(cents as number) ? cents : null,
        is_negotiable: negotiable,
        condition,
        category,
        images,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error("Erro ao publicar: " + error.message);
    toast.success("Item publicado!");
    navigate({ to: "/mercado/$itemId", params: { itemId: data.id } });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Carregando…</main>
        <SiteFooter />
      </div>
    );
  }

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-brand outline-none";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 py-8 md:py-14">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Vender um item</h1>
        <p className="mt-2 text-muted-foreground">
          Anuncie para os vizinhos e receba propostas pelo chat.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Bicicleta aro 26 seminova"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Conte o estado do item, tempo de uso, motivo da venda…"
              className="w-full p-4 rounded-xl bg-card border border-border focus:border-brand outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Preço (R$)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="250"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Estado</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as MarketCondition)}
                className={inputClass}
              >
                {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
              className="size-4 accent-[hsl(var(--brand))]"
            />
            Aceito propostas
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {MARKET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {MARKET_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Bairro</label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className={inputClass}
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Fotos (até 6)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-soft file:text-brand file:font-semibold"
            />
            {uploading && <p className="mt-2 text-sm text-muted-foreground">Enviando fotos…</p>}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((url) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={url} alt="Foto do item" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                      aria-label="Remover foto"
                      className="absolute top-1 right-1 size-7 rounded-full bg-background/90 border border-border flex items-center justify-center"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={saving || uploading}
            className="w-full h-12 bg-brand text-primary-foreground rounded-full font-bold shadow-brand disabled:opacity-60"
          >
            {saving ? "Publicando…" : "Publicar anúncio"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
