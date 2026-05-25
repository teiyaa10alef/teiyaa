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

export const Route = createFileRoute("/cidade/$citySlug")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params }) => {
    const { data: city } = await supabase
      .from("cities")
      .select("*")
      .eq("slug", params.citySlug)
      .maybeSingle();
    if (!city) throw notFound();
    const { data: state } = await supabase
      .from("states")
      .select("*")
      .eq("id", city.state_id)
      .maybeSingle();
    if (!state) throw notFound();
    return { city, state };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.city.name ?? "Cidade"} — teiyaa`,
      },
      {
        name: "description",
        content: `Anúncios em toda a cidade de ${loaderData?.city.name ?? ""}.`,
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">Cidade não encontrada.</div>
  ),
  component: CityPage,
});

function CityPage() {
  const { city, state } = Route.useLoaderData();
  const { cat } = Route.useSearch();
  const homeCommunity = useHomeCommunitySlug();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
            Visão da cidade
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
            {city.name}
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
            Anúncios de todas as comunidades ativas em {city.name}.
          </p>
          <div className="mt-6">
            <ScopeSwitcher
              active="city"
              communitySlug={homeCommunity}
              communityName="Minha comunidade"
              citySlug={city.slug}
              cityName={city.name}
              stateSlug={state.slug}
              stateName={state.name}
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          {cat ? categoryLabel(cat) : `Tudo em ${city.name}`}
        </h2>
        <ListingsFeed
          scope={{ kind: "city", slug: city.slug }}
          category={cat}
          basePath={`/cidade/${city.slug}`}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
