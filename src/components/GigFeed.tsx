import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Flame, SlidersHorizontal } from "lucide-react";
import { gigsPagedQuery, GIG_CATEGORIES, type Gig, type GigSort } from "@/lib/gigs-api";
import type { Scope } from "@/lib/listings-api";
import { usePagedFeed, useDebounced } from "@/hooks/use-paged-feed";
import { GigCard } from "./GigCard";
import { FeedCount, FeedPagination } from "./FeedPagination";
import { FeedSkeleton } from "./PageSkeletons";

type SortKey = GigSort;

export function GigFeed({ scope }: { scope: Scope }) {
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [weekOnly, setWeekOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recentes");
  const debouncedTerm = useDebounced(term);

  const feed = usePagedFeed<Gig>(
    gigsPagedQuery(scope, { term: debouncedTerm, category: cat, urgentOnly, weekOnly, sort }),
  );
  const availableCats = GIG_CATEGORIES;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar bico: carreto, faxina, montar móvel…"
            maxLength={80}
            aria-label="Buscar bico"
            className="w-full pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterButton active={urgentOnly} onClick={() => setUrgentOnly((v) => !v)}>
            <Flame className="size-4" /> Urgentes
          </FilterButton>
          <FilterButton active={weekOnly} onClick={() => setWeekOnly((v) => !v)}>
            Esta semana
          </FilterButton>
          <label className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ordenar"
              className="pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm font-semibold appearance-none"
            >
              <option value="recentes">Mais recentes</option>
              <option value="pagam-mais">Pagam mais</option>
              <option value="data">Data mais próxima</option>
            </select>
          </label>
        </div>
      </div>

      {availableCats.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          <Chip active={cat === null} onClick={() => setCat(null)} label="Todos" />
          {availableCats.map((c) => (
            <Chip
              key={c.value}
              active={cat === c.value}
              onClick={() => setCat(c.value)}
              label={`${c.emoji} ${c.label}`}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <FeedCount
          loaded={feed.items.length}
          total={feed.total}
          noun="bico encontrado"
          nounPlural="bicos encontrados"
        />
        <Link
          to="/freelances/novo"
          className="text-sm font-bold text-cat-freelance whitespace-nowrap"
        >
          + Publicar um bico
        </Link>
      </div>

      {feed.isLoading ? (
        <div className="mt-4">
          <FeedSkeleton />
        </div>
      ) : feed.items.length === 0 ? (
        <div className="mt-4 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
          <Flame className="size-10 mx-auto text-cat-freelance" />
          <h3 className="font-bold text-lg mt-3 mb-2">Nenhum bico por aqui ainda</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Precisa de uma ajuda rápida? Publique o bico, diga quanto paga e receba candidatos do
            bairro.
          </p>
          <Link
            to="/freelances/novo"
            className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
          >
            Publicar um bico
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.items.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
          <FeedPagination
            loaded={feed.items.length}
            total={feed.total}
            hasNextPage={feed.hasNextPage}
            isFetchingNextPage={feed.isFetchingNextPage}
            onLoadMore={feed.loadMore}
          />
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full border text-sm font-semibold whitespace-nowrap ${
        active
          ? "bg-cat-freelance text-primary-foreground border-cat-freelance"
          : "bg-card border-border text-foreground/80"
      }`}
    >
      {label}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full border text-sm font-semibold whitespace-nowrap inline-flex items-center gap-1.5 ${
        active
          ? "bg-cat-freelance text-primary-foreground border-cat-freelance"
          : "bg-card border-border"
      }`}
    >
      {children}
    </button>
  );
}
