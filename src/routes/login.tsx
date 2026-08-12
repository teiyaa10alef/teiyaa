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

function toE164(input: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (input.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [communitySlug, setCommunitySlug] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const { data: communities = [] } = useQuery(communitiesQuery);
  const activeCommunities = communities.filter((c) => c.is_active);

  const saveProfileExtras = async (userId: string, fullName: string) => {
    if (!photo) return;
    try {
      const avatarUrl = await uploadMedia(photo, userId, "avatar");
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl, display_name: fullName })
        .eq("user_id", userId);
    } catch {
      toast.message("Conta criada, mas não conseguimos salvar a foto. Adicione depois na sua conta.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const phoneE164 = toE164(phone);
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
    if (method === "phone" && phoneE164.length < 12) {
      toast.error("Informe um número válido com DDD.");
      return;
    }
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (mode === "signup") {
        if (method === "phone") {
          const { data, error } = await supabase.auth.signUp({
            phone: phoneE164,
            password,
            options: {
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
          if (data.session && data.user) {
            await saveProfileExtras(data.user.id, fullName);
            toast.success("Conta criada!");
            navigate({ to: "/" });
          } else {
            setOtpPhone(phoneE164);
            toast.success("Enviamos um código por SMS para confirmar seu número.");
          }
        } else {
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
          if (data.session && data.user) {
            await saveProfileExtras(data.user.id, fullName);
            toast.success("Conta criada!");
            navigate({ to: "/" });
          } else {
            if (photo) toast.message("Confirme seu e-mail e depois adicione a foto na sua conta.");
            setPendingEmail(email);
            toast.success("Conta criada! Verifique seu e-mail para confirmar.");
          }
        }
      } else {
        const { error } =
          method === "phone"
            ? await supabase.auth.signInWithPassword({ phone: phoneE164, password })
            : await supabase.auth.signInWithPassword({ email, password });
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

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpPhone) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: otpPhone,
        token: otpCode.trim(),
        type: "sms",
      });
      if (error) throw error;
      if (data.user) {
        await saveProfileExtras(data.user.id, `${firstName.trim()} ${lastName.trim()}`.trim());
      }
      toast.success("Número confirmado!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código inválido");
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

          {otpPhone ? (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
              <div className="rounded-2xl border border-brand/30 bg-brand/10 p-4 text-sm">
                Enviamos um código por SMS para <strong>{otpPhone}</strong>.
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Código de 6 dígitos"
                value={otpCode}
                onChange={(ev) => setOtpCode(ev.target.value)}
                required
                maxLength={10}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Aguarde…" : "Confirmar número"}
              </button>
              <button
                type="button"
                onClick={() => setOtpPhone(null)}
                className="text-sm text-muted-foreground hover:text-brand"
              >
                Voltar
              </button>
            </form>
          ) : (
            <>
              {pendingEmail && (
                <div className="mb-6 rounded-2xl border border-brand/30 bg-brand/10 p-4 text-sm">
                  <p className="font-semibold text-foreground">Conta criada!</p>
                  <p className="mt-1 text-muted-foreground">
                    Enviamos um link de confirmação para <strong>{pendingEmail}</strong>. Confirme seu
                    e-mail e depois entre com sua senha.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingEmail(null);
                      setMode("login");
                    }}
                    className="mt-3 text-brand font-semibold"
                  >
                    Ir para o login
                  </button>
                </div>
              )}

              <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
                {(["email", "phone"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-2 rounded-full text-sm font-semibold transition-colors ${
                      method === m
                        ? "bg-brand text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "email" ? "E-mail" : "Celular"}
                  </button>
                ))}
              </div>

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
                {method === "email" ? (
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type="tel"
                    placeholder="Celular com DDD (ex: 11 91234-5678)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={20}
                    className={inputClass}
                  />
                )}
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
                {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
              </button>
            </>
          )}

          <Link to="/" className="block mt-4 text-center text-xs text-muted-foreground hover:text-brand">
            Voltar ao início
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
