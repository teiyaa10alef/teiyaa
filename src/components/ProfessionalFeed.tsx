import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, HardHat, SlidersHorizontal } from "lucide-react";
import { professionalsByScopeQuery, PROFESSIONS } from "@/lib/professional-api";
import type { Scope } from "@/lib/listings-api";
import { ProfessionalCard } from "./ProfessionalCard";

type SortKey = "relevancia" | "avaliacao" | "experiencia" | "recentes";

export function ProfessionalFeed({ scope }: { scope: Scope }) {
  const { data: pros } = useSuspenseQuery(professionalsByScopeQuery(scope));

  const [term, setTerm] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [withPortfolio, setWithPortfolio] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevancia");

  const availableCats = useMemo(
    () => PROFESSIONS.filter((p) => pros.some((x) => x.category === p.value)),
    [pros],
  );

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    let list = pros.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (withPortfolio && p.portfolio_count === 0) return false;
      if (!q) return true;
      return (
        p.profession.toLowerCase().includes(q) ||
        (p.headline ?? "").toLowerCase().includes(q) ||
        (p.about ?? "").toLowerCase().includes(q) ||
        (p.display_name ?? "").toLowerCase().includes(q) ||
        (p.specialties ?? []).some((s) => s.toLowerCase().includes(q))
      );
    });
    if (sort === "avaliacao") {
      list = [...list].sort(
        (a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0) || b.rating_count - a.rating_count,
      );
    } else if (sort === "experiencia") {
      list = [...list].sort((a, b) => (b.years_experience ?? 0) - (a.years_experience ?? 0));
    } else if (sort === "recentes") {
      list = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    } else {
      list = [...list].sort(
        (a, b) =>
          (b.rating_avg ?? 0) - (a.rating_avg ?? 0) ||
          b.portfolio_count - a.portfolio_count ||
          b.rating_count - a.rating_count,
      );
    }
    return list;
  }, [pros, term, cat, withPortfolio, sort]);

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

      <p className="mt-4 text-xs text-muted-foreground">
        {filtered.length}{" "}
        {filtered.length === 1 ? "profissional encontrado" : "profissionais encontrados"}
      </p>

      {filtered.length === 0 ? (
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <ProfessionalCard key={p.id} pro={p} />
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
          ? "bg-cat-profissional text-primary-foreground border-cat-profissional"
          : "bg-card border-border text-foreground/80"
      }`}
    >
      {label}
    </button>
  );
}
