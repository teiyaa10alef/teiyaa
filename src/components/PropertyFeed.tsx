import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, Home, SlidersHorizontal } from "lucide-react";
import {
  propertiesByScopeQuery,
  KIND_LABELS,
  PROPERTY_KINDS,
  type PropertyKind,
  type PropertyPurpose,
} from "@/lib/properties-api";
import type { Scope } from "@/lib/listings-api";
import { PropertyCard } from "./PropertyCard";

type SortKey = "recentes" | "menor-preco" | "maior-preco";

export function PropertyFeed({ scope }: { scope: Scope }) {
  const { data: properties } = useSuspenseQuery(propertiesByScopeQuery(scope));

  const [term, setTerm] = useState("");
  const [purpose, setPurpose] = useState<PropertyPurpose | null>(null);
  const [kind, setKind] = useState<PropertyKind | null>(null);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [sort, setSort] = useState<SortKey>("recentes");

  const availableKinds = useMemo(
    () => PROPERTY_KINDS.filter((k) => properties.some((p) => p.kind === k)),
    [properties],
  );

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    let list = properties.filter((p) => {
      if (purpose && p.purpose !== purpose) return false;
      if (kind && p.kind !== kind) return false;
      if (minBedrooms && p.bedrooms < minBedrooms) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.address_hint ?? "").toLowerCase().includes(q)
      );
    });
    if (sort === "menor-preco") {
      list = [...list].sort((a, b) => (a.price_cents ?? Infinity) - (b.price_cents ?? Infinity));
    } else if (sort === "maior-preco") {
      list = [...list].sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
    } else {
      list = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    return list;
  }, [properties, term, purpose, kind, minBedrooms, sort]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar imóvel: casa, kitnet, 2 quartos…"
            maxLength={80}
            aria-label="Buscar imóvel"
            className="w-full pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Pill active={purpose === "aluguel"} onClick={() => setPurpose(purpose === "aluguel" ? null : "aluguel")}>
            Alugar
          </Pill>
          <Pill active={purpose === "venda"} onClick={() => setPurpose(purpose === "venda" ? null : "venda")}>
            Comprar
          </Pill>
          <label className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ordenar"
              className="pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm font-semibold appearance-none"
            >
              <option value="recentes">Mais recentes</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <Pill active={kind === null} onClick={() => setKind(null)}>
          Todos
        </Pill>
        {availableKinds.map((k) => (
          <Pill key={k} active={kind === k} onClick={() => setKind(k)}>
            {KIND_LABELS[k]}
          </Pill>
        ))}
        {[1, 2, 3].map((n) => (
          <Pill key={n} active={minBedrooms === n} onClick={() => setMinBedrooms(minBedrooms === n ? 0 : n)}>
            {n}+ quartos
          </Pill>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
        </p>
        <Link to="/imoveis/novo" className="text-sm font-bold text-cat-imovel whitespace-nowrap">
          + Anunciar imóvel
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
          <Home className="size-10 mx-auto text-cat-imovel" />
          <h3 className="font-bold text-lg mt-3 mb-2">Nenhum imóvel por aqui ainda</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Tem casa, kitnet ou quarto para alugar ou vender? Anuncie e fale direto com vizinhos.
          </p>
          <Link
            to="/imoveis/novo"
            className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
          >
            Anunciar imóvel
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({
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
      className={`px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap ${
        active ? "bg-cat-imovel text-primary-foreground border-cat-imovel" : "bg-card border-border"
      }`}
    >
      {children}
    </button>
  );
}
