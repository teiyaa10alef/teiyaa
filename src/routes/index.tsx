import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { communitiesQuery } from "@/lib/listings-api";
import { getStoredCommunitySlug } from "@/lib/community";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(communitiesQuery),
  component: OnboardingHome,
});

function OnboardingHome() {
  const { data: communities } = useSuspenseQuery(communitiesQuery);
  const navigate = useNavigate();

  // Client-only redirect avoids SSR/client hydration mismatch (localStorage is client-only).
  useEffect(() => {
    const slug = getStoredCommunitySlug();
    if (slug) {
      navigate({ to: "/c/$communitySlug", params: { communitySlug: slug }, replace: true });
    }
  }, [navigate]);

  const active = communities.filter((c) => c.is_active);
  const soon = communities.filter((c) => !c.is_active);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <section className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
          <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
            Bem-vindo ao teiyaa
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            Escolha a sua <span className="text-brand">comunidade</span>.
          </h1>
          <p className="mt-5 text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Você vai ver primeiro o que acontece no seu bairro. Depois é só
            expandir para a cidade ou o estado quando quiser.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-10 md:py-14 flex-1">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Comunidades ativas</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {active.map((c) => (
            <Link
              key={c.id}
              to="/c/$communitySlug"
              params={{ communitySlug: c.slug }}
              className="bg-card p-6 rounded-2xl border border-border hover:border-brand transition-all hover:-translate-y-0.5"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-brand mb-1">
                São Paulo • SP
              </div>
              <div className="text-2xl font-bold mb-2">{c.name}</div>
              {c.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {c.description}
                </p>
              )}
              <div className="mt-4 text-sm font-bold text-brand">
                Entrar nesta comunidade →
              </div>
            </Link>
          ))}
        </div>

        {soon.length > 0 && (
          <>
            <h2 className="text-xl md:text-2xl font-bold mt-10 mb-4">Em breve</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {soon.map((c) => (
                <div
                  key={c.id}
                  className="bg-muted p-4 rounded-2xl border border-dashed border-border text-center opacity-70"
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    Em breve
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
