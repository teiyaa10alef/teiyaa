import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listingsQuery, type Scope } from "@/lib/listings-api";
import { CATEGORY_LABELS, CATEGORY_ORDER, type CategoryKey } from "@/lib/community";
import { ListingCard } from "./ListingCard";

interface ListingsFeedProps {
  scope: Scope;
  category?: CategoryKey;
  basePath: string; // e.g. "/c/paraisopolis"
}

export function ListingsFeed({ scope, category, basePath }: ListingsFeedProps) {
  const { data: listings } = useSuspenseQuery(listingsQuery(scope, category));

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <Link
          to={basePath}
          search={{}}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            !category
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border hover:border-brand/40"
          }`}
        >
          Tudo
        </Link>
        {CATEGORY_ORDER.map((cat) => (
          <Link
            key={cat}
            to={basePath}
            search={{ cat }}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              category === cat
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border hover:border-brand/40"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </Link>
        ))}
      </div>

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
