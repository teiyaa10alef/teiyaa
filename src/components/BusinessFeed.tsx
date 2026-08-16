import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, Store, SlidersHorizontal } from "lucide-react";
import {
  businessesPagedQuery,
  BUSINESS_CATEGORIES,
  listFavoriteIds,
  addFavorite,
  removeFavorite,
  type BusinessCardData,
  type BusinessSort,
} from "@/lib/business-api";
import type { Scope } from "@/lib/listings-api";
import { useAuth } from "@/hooks/use-auth";
import { usePagedFeed, useDebounced } from "@/hooks/use-paged-feed";
import { BusinessCard } from "./BusinessCard";
import { FeedCount, FeedPagination } from "./FeedPagination";
import { FeedSkeleton } from "./PageSkeletons";

export function BusinessFeed({ scope }: { scope: Scope }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<BusinessSort>("relevancia");
  const debouncedTerm = useDebounced(term);

  const feed = usePagedFeed<BusinessCardData>(
    businessesPagedQuery(scope, { term: debouncedTerm, category: cat, openOnly, sort }),
  );

  const { data: favorites = [] } = useQuery({
    queryKey: ["business-favorites", user?.id],
    queryFn: () => listFavoriteIds(user!.id),
    enabled: !!user,
  });

  const toggleFavorite = async (id: string) => {
    if (!user) return;
    if (favorites.includes(id)) await removeFavorite(user.id, id);
    else await addFavorite(user.id, id);
    qc.invalidateQueries({ queryKey: ["business-favorites", user.id] });
  };

  const hasFilters = !!term || !!cat || openOnly;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar comércio, produto ou serviço"
            maxLength={80}
            aria-label="Buscar comércio"
            className="w-full pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpenOnly((v) => !v)}
            className={`px-4 py-2.5 rounded-full border text-sm font-semibold whitespace-nowrap ${
              openOnly
                ? "bg-cat-imovel text-primary-foreground border-cat-imovel"
                : "bg-card border-border"
            }`}
          >
            Aberto agora
          </button>
          <label className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as BusinessSort)}
              aria-label="Ordenar"
              className="pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm font-semibold appearance-none"
            >
              <option value="relevancia">Relevância</option>
              <option value="avaliacao">Melhor avaliados</option>
              <option value="recentes">Mais recentes</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <Chip active={cat === null} onClick={() => setCat(null)} label="Todos" />
        {BUSINESS_CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={cat === c.value}
            onClick={() => setCat(c.value)}
            label={`${c.emoji} ${c.label}`}
          />
        ))}
      </div>

      <div className="mt-4">
        <FeedCount
          loaded={feed.items.length}
          total={feed.total}
          noun="comércio encontrado"
          zeroLabel="Nenhum comércio encontrado"
          nounPlural="comércios encontrados"
        />
      </div>

      {feed.isLoading ? (
        <div className="mt-4">
          <FeedSkeleton />
        </div>
      ) : feed.items.length === 0 ? (
        <div className="mt-4 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
          <Store className="size-10 mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg mt-3 mb-2">
            {hasFilters ? "Nenhum comércio com esses filtros" : "Nenhum comércio por aqui ainda"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            {hasFilters
              ? "Tente limpar a busca ou escolher outra categoria."
              : "Tem um negócio no bairro? Cadastre grátis e apareça para os vizinhos."}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                setCat(null);
                setOpenOnly(false);
              }}
              className="inline-block px-6 py-3 bg-card border border-border rounded-full font-bold"
            >
              Limpar filtros
            </button>
          ) : (
            <Link
              to="/anunciar"
              className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
            >
              Cadastrar meu comércio
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.items.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                favorited={favorites.includes(b.id)}
                onToggleFavorite={user ? toggleFavorite : undefined}
              />
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
          ? "bg-cat-comercio text-primary-foreground border-cat-comercio"
          : "bg-card border-border text-foreground/80"
      }`}
    >
      {label}
    </button>
  );
}
