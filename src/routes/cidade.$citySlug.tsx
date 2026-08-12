import { createFileRoute, notFound } from "@tanstack/react-router";
import { useCategoryMemory } from "@/lib/use-category-memory";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScopeBar } from "@/components/ScopeBar";
import { ListingsFeed, CategoryPrompt } from "@/components/ListingsFeed";
import { categoryLabel } from "@/lib/community";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  cat: z.enum(["comercio", "servico", "imovel", "freelance", "vaga"]).optional(),
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
  useCategoryMemory(cat);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <ScopeBar
        active="city"
        currentLabel={city.name}
        citySlug={city.slug}
        cityName={city.name}
        stateSlug={state.slug}
        stateName={state.name}
        basePath={`/cidade/${city.slug}`}
        category={cat}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {cat ? (
          <>
            <h1 className="text-xl md:text-2xl font-bold mb-5">
              {categoryLabel(cat)} em {city.name}
            </h1>
            <ListingsFeed
              scope={{ kind: "city", slug: city.slug }}
              category={cat}
              basePath={`/cidade/${city.slug}`}
            />
          </>
        ) : (
          <CategoryPrompt basePath={`/cidade/${city.slug}`} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
