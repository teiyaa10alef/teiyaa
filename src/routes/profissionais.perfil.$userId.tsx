import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublicProfessional } from "@/lib/account-api";
import { MessageCircle, Phone, Instagram } from "lucide-react";

export const Route = createFileRoute("/profissionais/perfil/$userId")({
  head: () => ({ meta: [{ title: "Perfil profissional — teiyaa" }] }),
  component: PublicProfessional,
});

function PublicProfessional() {
  const { userId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["public-pro", userId],
    queryFn: () => getPublicProfessional(userId),
  });

  if (isLoading) return <Layout><p className="text-muted-foreground">Carregando…</p></Layout>;
  if (!data) return <Layout><p>Perfil não encontrado ou não publicado.</p></Layout>;

  const { profile, services, portfolio } = data;
  const waNumber = profile.whatsapp?.replace(/\D/g, "");

  return (
    <Layout>
      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-muted">
        {profile.cover_url && <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="-mt-12 px-4 md:px-6 flex items-end gap-4">
        <div className="size-24 md:size-32 rounded-full border-4 border-background bg-muted overflow-hidden flex-shrink-0">
          {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="pb-2">
          <h1 className="text-2xl md:text-3xl font-bold">{profile.profession}</h1>
          {profile.headline && <p className="text-muted-foreground">{profile.headline}</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {waNumber && (
          <a href={`https://wa.me/55${waNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-primary-foreground rounded-full font-bold">
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        )}
        {profile.phone && (
          <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold"><Phone className="size-4" /> Ligar</a>
        )}
        {profile.instagram && (
          <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold"><Instagram className="size-4" /> Instagram</a>
        )}
      </div>

      {profile.about && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2">Sobre</h2>
          <p className="text-muted-foreground whitespace-pre-line">{profile.about}</p>
        </section>
      )}

      {services.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Serviços</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.id} className="p-4 rounded-xl border border-border bg-surface">
                <p className="font-semibold">{s.title}</p>
                {s.price_from_cents != null && <p className="text-sm text-muted-foreground">a partir de R$ {(s.price_from_cents / 100).toFixed(2)} / {s.price_unit ?? "serviço"}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Portfólio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {portfolio.map((p) => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                {p.media_type === "video" ? (
                  <video src={p.media_url} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={p.media_url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
