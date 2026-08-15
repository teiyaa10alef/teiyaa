import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, HardHat, SlidersHorizontal } from "lucide-react";
import {
  professionalsPagedQuery,
  PROFESSIONS,
  type ProfessionalCardData,
  type ProfessionalSort,
} from "@/lib/professional-api";
import type { Scope } from "@/lib/listings-api";
import { usePagedFeed, useDebounced } from "@/hooks/use-paged-feed";
import { ProfessionalCard } from "./ProfessionalCard";
import { FeedCount, FeedPagination } from "./FeedPagination";
import { FeedSkeleton } from "./PageSkeletons";

type SortKey = ProfessionalSort;

export function ProfessionalFeed({ scope }: { scope: Scope }) {
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [withPortfolio, setWithPortfolio] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevancia");
  const debouncedTerm = useDebounced(term);

  const feed = usePagedFeed<ProfessionalCardData>(
    professionalsPagedQuery(scope, { term: debouncedTerm, category: cat, withPortfolio, sort }),
  );
  const availableCats = PROFESSIONS;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar pedreiro, eletricista, diarista…"
            maxLength={80}
            aria-label="Buscar profissional"
            className="w-full pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWithPortfolio((v) => !v)}
            className={`px-4 py-2.5 rounded-full border text-sm font-semibold whitespace-nowrap ${
              withPortfolio
                ? "bg-cat-profissional text-primary-foreground border-cat-profissional"
                : "bg-card border-border"
            }`}
          >
            Com portfólio
          </button>
          <label className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ordenar"
              className="pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm font-semibold appearance-none"
            >
              <option value="relevancia">Relevância</option>
              <option value="avaliacao">Melhor avaliados</option>
              <option value="experiencia">Mais experientes</option>
              <option value="recentes">Mais recentes</option>
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

      <div className="mt-4">
        <FeedCount
          loaded={feed.items.length}
          total={feed.total}
          noun="profissional encontrado"
          nounPlural="profissionais encontrados"
        />
      </div>

      {feed.isLoading ? (
        <div className="mt-4">
          <FeedSkeleton />
        </div>
      ) : feed.items.length === 0 ? (
        <div className="mt-4 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
          <HardHat className="size-10 mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg mt-3 mb-2">Nenhum profissional por aqui ainda</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Você presta serviço no bairro? Monte seu portfólio grátis e receba pedidos de orçamento.
          </p>
          <Link
            to="/conta/profissional"
            className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
          >
            Criar meu perfil profissional
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.items.map((p) => (
              <ProfessionalCard key={p.id} pro={p} />
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
          ? "bg-cat-profissional text-primary-foreground border-cat-profissional"
          : "bg-card border-border text-foreground/80"
      }`}
    >
      {label}
    </button>
  );
}
