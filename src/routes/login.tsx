import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { communitiesQuery } from "@/lib/listings-api";
import { setStoredCommunitySlug } from "@/lib/community";
import { uploadMedia } from "@/lib/upload";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — teiyaa" },
      { name: "description", content: "Entre ou cadastre-se no teiyaa." },
    ],
  }),
  component: LoginPage,
});

const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [communitySlug, setCommunitySlug] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const { data: communities = [] } = useQuery(communitiesQuery);
  const activeCommunities = communities.filter((c) => c.is_active);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      if (password !== confirmPassword) {
        toast.error("As senhas não conferem.");
        return;
      }
      if (!communitySlug) {
        toast.error("Selecione sua comunidade.");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              community_slug: communitySlug,
            },
          },
        });
        if (error) throw error;
        setStoredCommunitySlug(communitySlug);

        const userId = data.user?.id;
        if (data.session && userId && photo) {
          try {
            const avatarUrl = await uploadMedia(photo, userId, "avatar");
            await supabase
              .from("profiles")
              .update({ avatar_url: avatarUrl, display_name: fullName })
              .eq("user_id", userId);
          } catch {
            toast.message("Conta criada, mas não conseguimos salvar a foto. Você pode adicioná-la na sua conta.");
          }
        } else if (photo) {
          toast.message("Confirme seu e-mail e depois adicione a foto na sua conta.");
        }

        if (data.session) {
          toast.success("Conta criada!");
          navigate({ to: "/" });
        } else {
          setPendingEmail(email);
          toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-surface rounded-3xl border border-border p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login"
              ? "Acesse sua conta para anunciar e se candidatar."
              : "Cadastre-se para anunciar, se candidatar e contratar."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={60}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Sobrenome"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={60}
                  className={inputClass}
                />
              </div>
            )}
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={72}
              className={inputClass}
            />
            {mode === "signup" && (
              <>
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                  className={inputClass}
                />
                <select
                  value={communitySlug}
                  onChange={(e) => setCommunitySlug(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Selecione sua comunidade</option>
                  {activeCommunities.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <label className="text-sm text-muted-foreground">
                  Foto de perfil (opcional)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    className="mt-1 w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-muted file:text-foreground"
                  />
                </label>
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 w-full text-sm text-muted-foreground hover:text-brand"
          >
            {mode === "login"
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Entrar"}
          </button>

          <Link to="/" className="block mt-4 text-center text-xs text-muted-foreground hover:text-brand">
            Voltar ao início
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

