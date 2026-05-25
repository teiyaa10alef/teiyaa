import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScopeSwitcher } from "@/components/ScopeSwitcher";
import { ListingsFeed } from "@/components/ListingsFeed";
import { useHomeCommunitySlug, categoryLabel } from "@/lib/community";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  cat: (
    z.enum(["comercio", "servico", "imovel", "freelance", "vaga"]).optional(),
    undefined,
  ),
});

export const Route = createFileRoute("/estado/$stateSlug")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params }) => {
    const { data: state } = await supabase
      .from("states")
      .select("*")
      .eq("slug", params.stateSlug)
      .maybeSingle();
    if (!state) throw notFound();
    // Pick a default city to show in the switcher (first city of state)
    const { data: city } = await supabase
      .from("cities")
      .select("*")
      .eq("state_id", state.id)
      .order("name")
      .limit(1)
      .maybeSingle();
    return { state, city };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.state.name ?? "Estado"} — teiyaa` },
      {
        name: "description",
        content: `Anúncios em todo o estado de ${loaderData?.state.name ?? ""}.`,
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">Estado não encontrado.</div>
  ),
  component: StatePage,
});

function StatePage() {
  const { state, city } = Route.useLoaderData();
  const { cat } = Route.useSearch();
  const homeCommunity = useHomeCommunitySlug();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
            Visão do estado
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
            {state.name}
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
            Anúncios de todas as cidades e comunidades em {state.name}.
          </p>
          <div className="mt-6">
            <ScopeSwitcher
              active="state"
              communitySlug={homeCommunity}
              communityName="Minha comunidade"
              citySlug={city?.slug ?? "sao-paulo"}
              cityName={city?.name ?? "Cidade"}
              stateSlug={state.slug}
              stateName={state.name}
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          {cat ? categoryLabel(cat) : `Tudo em ${state.name}`}
        </h2>
        <ListingsFeed
          scope={{ kind: "state", slug: state.slug }}
          category={cat}
          basePath={`/estado/${state.slug}`}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
