import { useEffect, useState } from "react";

const STORAGE_KEY = "teiyaa:home-community-slug";
export const DEFAULT_COMMUNITY_SLUG = "paraisopolis";

export type CategoryKey = "comercio" | "servico" | "imovel" | "freelance" | "vaga";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  comercio: "Comércios",
  servico: "Serviços",
  imovel: "Imóveis",
  freelance: "Freelances",
  vaga: "Vagas",
};

export const CATEGORY_ORDER: CategoryKey[] = [
  "comercio",
  "servico",
  "imovel",
  "freelance",
  "vaga",
];

// URL slug used in old category routes -> enum key
export const CATEGORY_SLUG_TO_KEY: Record<string, CategoryKey> = {
  comercios: "comercio",
  servicos: "servico",
  imoveis: "imovel",
  freelances: "freelance",
  vagas: "vaga",
};

export const CATEGORY_KEY_TO_SLUG: Record<CategoryKey, string> = {
  comercio: "comercios",
  servico: "servicos",
  imovel: "imoveis",
  freelance: "freelances",
  vaga: "vagas",
};

export function getStoredCommunitySlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCommunitySlug(slug: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // ignore
  }
}

export function useHomeCommunitySlug(): string {
  const [slug, setSlug] = useState<string>(DEFAULT_COMMUNITY_SLUG);
  useEffect(() => {
    const stored = getStoredCommunitySlug();
    if (stored) setSlug(stored);
  }, []);
  return slug;
}
