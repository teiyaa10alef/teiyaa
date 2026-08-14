import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, Briefcase, SlidersHorizontal } from "lucide-react";
import {
  isJobExpired,
  jobsByScopeQuery,
  jobSalaryFloor,
  JOB_AREAS,
  JOB_CONTRACT_LABELS,
  JOB_EXPERIENCE_LABELS,
  type JobContractType,
  type JobExperienceLevel,
} from "@/lib/jobs-api";
import type { Scope } from "@/lib/listings-api";
import { JobCard } from "./JobCard";

type SortKey = "recentes" | "salario";

export function JobFeed({ scope }: { scope: Scope }) {
  const { data: jobs } = useSuspenseQuery(jobsByScopeQuery(scope));

  const [term, setTerm] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [contract, setContract] = useState<JobContractType | "">("");
  const [experience, setExperience] = useState<JobExperienceLevel | "">("");
  const [sort, setSort] = useState<SortKey>("recentes");

  const availableAreas = useMemo(
    () => JOB_AREAS.filter((a) => jobs.some((j) => j.area === a.value)),
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    let list = jobs.filter((j) => {
      if (isJobExpired(j)) return false;
      if (area && j.area !== area) return false;
      if (contract && j.contract_type !== contract) return false;
      if (experience && j.experience_level !== experience) return false;
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.company_name ?? "").toLowerCase().includes(q)
      );
    });
    if (sort === "salario") {
      list = [...list].sort((a, b) => (jobSalaryFloor(b) ?? 0) - (jobSalaryFloor(a) ?? 0));
    } else {
      list = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    return list;
  }, [jobs, term, area, contract, experience, sort]);


  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar vaga: atendente, motoboy, auxiliar…"
            maxLength={80}
            aria-label="Buscar vaga"
            className="w-full pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <label className="relative">
            <select
              value={contract}
              onChange={(e) => setContract(e.target.value as JobContractType | "")}
              aria-label="Tipo de contrato"
              className="pl-3 pr-3 py-2.5 rounded-full border border-border bg-card text-sm font-semibold appearance-none"
            >
              <option value="">Todos os contratos</option>
              {Object.entries(JOB_CONTRACT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ordenar"
              className="pl-9 pr-3 py-2.5 rounded-full border border-border bg-card text-sm font-semibold appearance-none"
            >
              <option value="recentes">Mais recentes</option>
              <option value="salario">Melhor salário</option>
            </select>
          </label>
        </div>
      </div>

      {availableAreas.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          <Chip active={area === null} onClick={() => setArea(null)} label="Todas" />
          {availableAreas.map((a) => (
            <Chip
              key={a.value}
              active={area === a.value}
              onClick={() => setArea(a.value)}
              label={`${a.emoji} ${a.label}`}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "vaga encontrada" : "vagas encontradas"}
        </p>
        <Link to="/vagas/novo" className="text-sm font-bold text-cat-vaga whitespace-nowrap">
          + Publicar uma vaga
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
          <Briefcase className="size-10 mx-auto text-cat-vaga" />
          <h3 className="font-bold text-lg mt-3 mb-2">Nenhuma vaga por aqui ainda</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Tem um negócio no bairro e precisa contratar? Publique a vaga e receba candidatos
            vizinhos.
          </p>
          <Link
            to="/vagas/novo"
            className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
          >
            Publicar uma vaga
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((j) => (
            <JobCard key={j.id} job={j} />
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
          ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
          : "bg-card border-border text-foreground/80"
      }`}
    >
      {label}
    </button>
  );
}
