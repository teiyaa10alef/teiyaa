import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScopeBar } from "@/components/ScopeBar";
import { ListingsFeed, CategoryPrompt } from "@/components/ListingsFeed";
import { communityBySlugQuery } from "@/lib/listings-api";
import { setStoredCommunitySlug, categoryLabel } from "@/lib/community";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  cat: z.enum(["comercio", "servico", "imovel", "freelance", "vaga"]).optional(),
});

export const Route = createFileRoute("/c/$communitySlug")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params, context }) => {
    const community = await context.queryClient.ensureQueryData(
      communityBySlugQuery(params.communitySlug),
    );
    if (!community) throw notFound();
    // Pre-fetch city + state (we need names for switcher)
    const { data: city } = await supabase
      .from("cities")
      .select("*")
      .eq("id", community.city_id)
      .maybeSingle();
    if (!city) throw notFound();
    const { data: state } = await supabase
      .from("states")
      .select("*")
      .eq("id", city.state_id)
      .maybeSingle();
    if (!state) throw notFound();
    return { community, city, state };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.community.name ?? "Comunidade";
    return {
      meta: [
        { title: `${name} — teiyaa` },
        {
          name: "description",
          content: `Comércios, serviços, imóveis, freelances e vagas em ${name}.`,
        },
        { property: "og:title", content: `${name} — teiyaa` },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">
      <p className="text-destructive">Erro: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-3xl font-bold mb-3">Comunidade não encontrada</h1>
          <p className="text-muted-foreground">
            Essa comunidade ainda não está no teiyaa.
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
  component: CommunityPage,
});

function CommunityPage() {
  const { community, city, state } = Route.useLoaderData();
  const { cat } = Route.useSearch();

  useEffect(() => {
    setStoredCommunitySlug(community.slug);
  }, [community.slug]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <ScopeBar
        active="community"
        currentLabel={community.name}
        citySlug={city.slug}
        cityName={city.name}
        stateSlug={state.slug}
        stateName={state.name}
        basePath={`/c/${community.slug}`}
        category={cat}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {cat ? (
          <>
            <h1 className="text-xl md:text-2xl font-bold mb-5">
              {categoryLabel(cat)} em {community.name}
            </h1>
            <ListingsFeed
              scope={{ kind: "community", slug: community.slug }}
              category={cat}
              basePath={`/c/${community.slug}`}
            />
          </>
        ) : (
          <CategoryPrompt basePath={`/c/${community.slug}`} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
