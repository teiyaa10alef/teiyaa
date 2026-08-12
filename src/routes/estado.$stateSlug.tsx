import { createFileRoute, notFound } from "@tanstack/react-router";
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <ScopeBar
        active="state"
        currentLabel={state.name}
        citySlug={city?.slug ?? "sao-paulo"}
        cityName={city?.name ?? "Cidade"}
        stateSlug={state.slug}
        stateName={state.name}
        basePath={`/estado/${state.slug}`}
        category={cat}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {cat ? (
          <>
            <h1 className="text-xl md:text-2xl font-bold mb-5">
              {categoryLabel(cat)} em {state.name}
            </h1>
            <ListingsFeed
              scope={{ kind: "state", slug: state.slug }}
              category={cat}
              basePath={`/estado/${state.slug}`}
            />
          </>
        ) : (
          <CategoryPrompt basePath={`/estado/${state.slug}`} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
