import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, Store, SlidersHorizontal } from "lucide-react";
import {
  businessesByScopeQuery,
  BUSINESS_CATEGORIES,
  isOpenNow,
  listFavoriteIds,
  addFavorite,
  removeFavorite,
} from "@/lib/business-api";
import type { Scope } from "@/lib/listings-api";
import { useAuth } from "@/hooks/use-auth";
import { BusinessCard } from "./BusinessCard";

type SortKey = "relevancia" | "avaliacao" | "recentes";

export function BusinessFeed({ scope }: { scope: Scope }) {
  const { data: businesses } = useSuspenseQuery(businessesByScopeQuery(scope));
  const { user } = useAuth();
  const qc = useQueryClient();

  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevancia");

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

  const availableCats = useMemo(
    () => BUSINESS_CATEGORIES.filter((c) => businesses.some((b) => b.category === c.value)),
    [businesses],
  );

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    let list = businesses.filter((b) => {
      if (cat && b.category !== cat) return false;
      if (openOnly && isOpenNow(b.hours) !== true) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q) ||
        (b.category ?? "").toLowerCase().includes(q)
      );
    });
    if (sort === "avaliacao") {
      list = [...list].sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0));
    } else if (sort === "recentes") {
      list = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    } else {
      list = [...list].sort(
        (a, b) =>
          Number(isOpenNow(b.hours) === true) - Number(isOpenNow(a.hours) === true) ||
          b.promo_count - a.promo_count ||
          (b.rating_avg ?? 0) - (a.rating_avg ?? 0),
      );
    }
    return list;
  }, [businesses, term, cat, openOnly, sort]);

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
              onChange={(e) => setSort(e.target.value as SortKey)}
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

      <p className="mt-4 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "comércio encontrado" : "comércios encontrados"}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
          <Store className="size-10 mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg mt-3 mb-2">Nenhum comércio por aqui ainda</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Tem um negócio no bairro? Cadastre grátis e apareça para os vizinhos.
          </p>
          <Link
            to="/anunciar"
            className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
          >
            Cadastrar meu comércio
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              favorited={favorites.includes(b.id)}
              onToggleFavorite={user ? toggleFavorite : undefined}
            />
          ))}
        </div>
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
