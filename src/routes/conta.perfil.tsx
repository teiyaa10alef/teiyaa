import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Upload, User } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, updateMyProfile, splitName } from "@/lib/account-api";
import { uploadMedia } from "@/lib/upload";

export const Route = createFileRoute("/conta/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — teiyaa" },
      {
        name: "description",
        content:
          "Atualize sua foto, nome, sobrenome e contatos. Esses dados aparecem no seu perfil profissional e nos seus anúncios.",
      },
      { property: "og:title", content: "Meu perfil — teiyaa" },
      {
        property: "og:description",
        content: "Foto, nome e contatos da sua conta no teiyaa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeuPerfil,
});

function MeuPerfil() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: !!user,
  });

  const [form, setForm] = useState({
    first: "",
    last: "",
    avatar_url: "",
    bio: "",
    phone: "",
    whatsapp: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const { first, last } = splitName(profile.display_name);
      setForm({
        first,
        last,
        avatar_url: profile.avatar_url ?? "",
        bio: profile.bio ?? "",
        phone: profile.phone ?? "",
        whatsapp: profile.whatsapp ?? "",
      });
    }
  }, [profile]);

  const pickAvatar = async (file: File) => {
    if (!user) return;
    try {
      const url = await uploadMedia(file, user.id, "avatar");
      setForm((f) => ({ ...f, avatar_url: url }));
      toast.success("Foto enviada — clique em Salvar");
    } catch (err) {
      toast.error("Erro no upload: " + (err as Error).message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.first.trim() || !form.last.trim()) {
      toast.error("Informe nome e sobrenome.");
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile(user.id, {
        display_name: `${form.first.trim()} ${form.last.trim()}`,
        avatar_url: form.avatar_url || null,
        bio: form.bio || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
      });
      toast.success("Perfil atualizado!");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (err) {
      toast.error("Erro ao salvar: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading || !user) {
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <Link
          to="/conta"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Minha conta
        </Link>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold">Meu perfil</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sua foto e seu nome aparecem no seu perfil profissional, nas avaliações e nos seus
          anúncios.
        </p>

        <form
          onSubmit={submit}
          className="mt-6 space-y-5 p-5 md:p-6 rounded-2xl border border-border bg-surface"
        >
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-2xl border border-border bg-muted overflow-hidden flex items-center justify-center">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Sua foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <User className="size-8 text-muted-foreground" />
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border font-semibold text-sm cursor-pointer">
              <Upload className="size-4" />
              {form.avatar_url ? "Trocar foto" : "Enviar foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && pickAvatar(e.target.files[0])}
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome *">
              <input
                className={inputCls}
                value={form.first}
                onChange={(e) => setForm({ ...form, first: e.target.value })}
              />
            </Field>
            <Field label="Sobrenome *">
              <input
                className={inputCls}
                value={form.last}
                onChange={(e) => setForm({ ...form, last: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Bio">
            <textarea
              className={inputCls + " min-h-24"}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Conte um pouco sobre você para seus vizinhos"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="WhatsApp">
              <input
                className={inputCls}
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="11 99999-9999"
              />
            </Field>
            <Field label="Telefone">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </div>

          <button
            disabled={saving}
            className="w-full py-3 bg-brand text-primary-foreground rounded-full font-bold disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar perfil"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
