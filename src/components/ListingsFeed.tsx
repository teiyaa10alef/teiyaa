import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { listingsQuery, type Scope } from "@/lib/listings-api";
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/community";
import { CATEGORY_ICONS, CATEGORY_SOFT, VISUAL_LABELS } from "@/lib/category-visuals";
import { ListingCard } from "./ListingCard";
import { BusinessFeed } from "./BusinessFeed";
import { ProfessionalFeed } from "./ProfessionalFeed";
import { GigFeed } from "./GigFeed";


interface ListingsFeedProps {
  scope: Scope;
  category?: CategoryKey;
  basePath: string; // e.g. "/c/paraisopolis"
}

export function CategoryPrompt({ basePath }: { basePath: string }) {
  return (
    <div className="py-8">
      <h2 className="text-lg md:text-xl font-bold mb-1">O que você procura?</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Escolha uma área para ver os anúncios da sua região.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CATEGORY_ORDER.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          return (
            <Link
              key={cat}
              to={basePath}
              search={{ cat }}
              className="px-4 py-4 rounded-2xl border bg-card font-semibold text-sm flex items-center gap-2 hover:-translate-y-0.5 transition-transform"
            >
              <span
                className={`size-8 rounded-xl flex items-center justify-center border ${CATEGORY_SOFT[cat]}`}
              >
                <Icon className="size-4" />
              </span>
              {VISUAL_LABELS[cat]}
            </Link>
          );
        })}
        <Link
          to="/mercado"
          className="px-4 py-4 rounded-2xl border bg-card font-semibold text-sm flex items-center gap-2 hover:-translate-y-0.5 transition-transform"
        >
          <span
            className={`size-8 rounded-xl flex items-center justify-center border ${CATEGORY_SOFT.mercado}`}
          >
            <ShoppingBag className="size-4" />
          </span>
          Marketplace
        </Link>
      </div>
    </div>
  );
}

export function ListingsFeed({ scope, category }: ListingsFeedProps) {
  let content: React.ReactNode;
  if (category === "comercio") content = <BusinessFeed scope={scope} />;
  else if (category === "servico") content = <ProfessionalFeed scope={scope} />;
  else if (category === "freelance") content = <GigFeed scope={scope} />;
  else content = <GenericListingsFeed scope={scope} category={category} />;

  return (
    <Suspense key={category ?? "all"} fallback={<FeedSkeleton />}>
      {content}
    </Suspense>
  );
}



function GenericListingsFeed({ scope, category }: Omit<ListingsFeedProps, "basePath">) {
  const { data: listings } = useSuspenseQuery(listingsQuery(scope, category));


  return (
    <div>
      {listings.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="font-bold text-lg mb-2">Nenhum anúncio por aqui ainda</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Seja o primeiro a publicar e ajude a movimentar o ecossistema do bairro.
          </p>
          <Link
            to="/anunciar"
            className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
          >
            Publicar anúncio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
