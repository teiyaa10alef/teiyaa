import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, Flame, SlidersHorizontal } from "lucide-react";
import { gigsByScopeQuery, GIG_CATEGORIES, type Gig } from "@/lib/gigs-api";
import type { Scope } from "@/lib/listings-api";
import { GigCard } from "./GigCard";

type SortKey = "recentes" | "pagam-mais" | "data";

function isThisWeek(gig: Gig) {
  if (!gig.scheduled_date) return false;
  const d = new Date(`${gig.scheduled_date}T00:00:00`);
  const now = new Date();
  const diff = (d.getTime() - new Date(now.toDateString()).getTime()) / 86400000;
  return diff >= 0 && diff <= 7;
}

export function GigFeed({ scope }: { scope: Scope }) {
  const { data: gigs } = useSuspenseQuery(gigsByScopeQuery(scope));

  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [weekOnly, setWeekOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recentes");

  const availableCats = useMemo(
    () => GIG_CATEGORIES.filter((c) => gigs.some((g) => g.category === c.value)),
    [gigs],
  );

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    let list = gigs.filter((g) => {
      if (cat && g.category !== cat) return false;
      if (urgentOnly && !g.is_urgent) return false;
      if (weekOnly && !isThisWeek(g)) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        (g.address_hint ?? "").toLowerCase().includes(q)
      );
    });
    if (sort === "pagam-mais") {
      list = [...list].sort((a, b) => (b.budget_cents ?? 0) - (a.budget_cents ?? 0));
    } else if (sort === "data") {
      list = [...list].sort((a, b) =>
        (a.scheduled_date ?? "9999").localeCompare(b.scheduled_date ?? "9999"),
      );
    } else {
      list = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    return list;
  }, [gigs, term, cat, urgentOnly, weekOnly, sort]);

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
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "bico encontrado" : "bicos encontrados"}
        </p>
        <Link
          to="/freelances/novo"
          className="text-sm font-bold text-cat-freelance whitespace-nowrap"
        >
          + Publicar um bico
        </Link>
      </div>

      {filtered.length === 0 ? (
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((g) => (
            <GigCard key={g.id} gig={g} />
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
