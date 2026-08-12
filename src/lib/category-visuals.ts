import {
  Store,
  HardHat,
  Home,
  Flame,
  Briefcase,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import type { CategoryKey } from "./community";

export type VisualKey = CategoryKey | "mercado";

export const CATEGORY_ICONS: Record<VisualKey, LucideIcon> = {
  comercio: Store,
  servico: HardHat,
  imovel: Home,
  freelance: Flame,
  vaga: Briefcase,
  mercado: ShoppingBag,
};

/** Tailwind classes for the inactive (soft) state. */
export const CATEGORY_SOFT: Record<VisualKey, string> = {
  comercio: "bg-cat-comercio-soft text-cat-comercio border-cat-comercio/25",
  servico: "bg-cat-profissional-soft text-cat-profissional border-cat-profissional/25",
  imovel: "bg-cat-imovel-soft text-cat-imovel border-cat-imovel/25",
  freelance: "bg-cat-freelance-soft text-cat-freelance border-cat-freelance/25",
  vaga: "bg-cat-vaga-soft text-cat-vaga border-cat-vaga/25",
  mercado: "bg-cat-mercado-soft text-cat-mercado border-cat-mercado/25",
};

/** Tailwind classes for the active (solid) state. */
export const CATEGORY_SOLID: Record<VisualKey, string> = {
  comercio: "bg-cat-comercio text-primary-foreground border-cat-comercio",
  servico: "bg-cat-profissional text-primary-foreground border-cat-profissional",
  imovel: "bg-cat-imovel text-primary-foreground border-cat-imovel",
  freelance: "bg-cat-freelance text-primary-foreground border-cat-freelance",
  vaga: "bg-cat-vaga text-primary-foreground border-cat-vaga",
  mercado: "bg-cat-mercado text-primary-foreground border-cat-mercado",
};

export const VISUAL_LABELS: Record<VisualKey, string> = {
  comercio: "Comércios",
  servico: "Profissionais",
  imovel: "Imóveis",
  freelance: "Freelances",
  vaga: "Vagas",
  mercado: "Marketplace",
};
