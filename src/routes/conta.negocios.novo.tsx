import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createBusiness, slugify } from "@/lib/account-api";
import { communitiesQuery } from "@/lib/listings-api";

export const Route = createFileRoute("/conta/negocios/novo")({
  head: () => ({ meta: [{ title: "Novo negócio — teiyaa" }] }),
  component: NovoNegocio,
});

function NovoNegocio() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: communities = [] } = useQuery(communitiesQuery);
  const [form, setForm] = useState({ name: "", category: "", community_id: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    setSaving(true);
    try {
      const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const b = await createBusiness(user.id, {
        name: form.name.trim(),
        slug,
        category: form.category || null,
        community_id: form.community_id || null,
      });
      toast.success("Negócio criado!");
      navigate({ to: "/conta/negocios/$businessId", params: { businessId: b.id } });
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <Link to="/conta/negocios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Meus negócios
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Novo negócio</h1>
        <p className="text-muted-foreground mt-1">Comece com o nome. Os detalhes você completa depois.</p>

        <form onSubmit={handleCreate} className="mt-8 space-y-5 p-6 rounded-2xl border border-border bg-surface">
          <Field label="Nome do negócio *">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Categoria">
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Selecione</option>
              <option value="alimentacao">Alimentação</option>
              <option value="beleza">Beleza e estética</option>
              <option value="varejo">Varejo</option>
              <option value="saude">Saúde</option>
              <option value="moda">Moda</option>
              <option value="servicos">Serviços</option>
              <option value="outros">Outros</option>
            </select>
          </Field>
          <Field label="Bairro / comunidade">
            <select className={inputCls} value={form.community_id} onChange={(e) => setForm({ ...form, community_id: e.target.value })}>
              <option value="">Selecione</option>
              {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <button disabled={saving} className="w-full py-3 bg-brand text-primary-foreground rounded-full font-bold disabled:opacity-60">
            {saving ? "Criando…" : "Criar e continuar"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
