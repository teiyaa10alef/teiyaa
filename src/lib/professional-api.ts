import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Scope } from "./listings-api";
import type { ProfessionalProfile, ProfessionalService } from "./account-api";

const db = supabase as any;

export const PROFESSIONS = [
  { value: "pedreiro", label: "Pedreiro", emoji: "🧱" },
  { value: "pintor", label: "Pintor", emoji: "🎨" },
  { value: "eletricista", label: "Eletricista", emoji: "💡" },
  { value: "encanador", label: "Encanador", emoji: "🚿" },
  { value: "diarista", label: "Diarista", emoji: "🧹" },
  { value: "montador", label: "Montador de móveis", emoji: "🪛" },
  { value: "marceneiro", label: "Marceneiro", emoji: "🪵" },
  { value: "climatizacao", label: "Ar-condicionado e refrigeração", emoji: "❄️" },
  { value: "jardinagem", label: "Jardinagem", emoji: "🌱" },
  { value: "frete", label: "Frete e mudança", emoji: "🚚" },
  { value: "beleza", label: "Beleza e estética", emoji: "💇" },
  { value: "tecnologia", label: "Tecnologia e informática", emoji: "💻" },
  { value: "outros", label: "Outros", emoji: "✨" },
] as const;

export function professionLabel(value: string | null | undefined): string {
  if (!value) return "Profissional";
  return PROFESSIONS.find((p) => p.value === value)?.label ?? value;
}

export type PortfolioEntry = {
  id: string;
  professional_id: string;
  media_url: string;
  media_type: string;
  title: string | null;
  caption: string | null;
  is_cover: boolean;
  sort_order: number;
};

export type ProfessionalReview = {
  id: string;
  professional_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null } | null;
};

export type ProfessionalLead = {
  id: string;
  professional_id: string;
  requester_id: string;
  description: string;
  budget_cents: number | null;
  contact_whatsapp: string | null;
  status: "novo" | "respondido" | "fechado";
  created_at: string;
  requester?: { display_name: string | null; avatar_url: string | null } | null;
};

export type ProfessionalCardData = ProfessionalProfile & {
  created_at: string;
  updated_at: string;
  view_count: number;
  whatsapp_click_count: number;
  specialties: string[];
  category: string | null;
  rating_avg: number | null;
  rating_count: number;
  portfolio_preview: PortfolioEntry[];
  portfolio_count: number;
  price_from_cents: number | null;
  display_name: string | null;
  owner_avatar_url?: string | null;

};

async function communityIdsForScope(scope: Scope): Promise<string[]> {
  if (scope.kind === "community") {
    const { data, error } = await db.from("communities").select("id").eq("slug", scope.slug);
    if (error) throw error;
    return (data ?? []).map((c: { id: string }) => c.id);
  }
  if (scope.kind === "city") {
    const { data: city, error: e1 } = await db
      .from("cities")
      .select("id")
      .eq("slug", scope.slug)
      .maybeSingle();
    if (e1) throw e1;
    if (!city) return [];
    const { data, error } = await db.from("communities").select("id").eq("city_id", city.id);
    if (error) throw error;
    return (data ?? []).map((c: { id: string }) => c.id);
  }
  const { data: state, error: e2 } = await db
    .from("states")
    .select("id")
    .eq("slug", scope.slug)
    .maybeSingle();
  if (e2) throw e2;
  if (!state) return [];
  const { data: cities, error: e3 } = await db.from("cities").select("id").eq("state_id", state.id);
  if (e3) throw e3;
  const cityIds = (cities ?? []).map((c: { id: string }) => c.id);
  if (cityIds.length === 0) return [];
  const { data, error } = await db.from("communities").select("id").in("city_id", cityIds);
  if (error) throw error;
  return (data ?? []).map((c: { id: string }) => c.id);
}

export const professionalsByScopeQuery = (scope: Scope) =>
  queryOptions({
    queryKey: ["professionals", scope.kind, scope.slug],
    queryFn: async (): Promise<ProfessionalCardData[]> => {
      const communityIds = await communityIdsForScope(scope);
      if (communityIds.length === 0) return [];
      const { data, error } = await db
        .from("professional_profiles")
        .select("*")
        .in("community_id", communityIds)
        .eq("is_published", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const pros = (data ?? []) as ProfessionalCardData[];
      if (pros.length === 0) return [];
      const ids = pros.map((p) => p.id);
      const userIds = [...new Set(pros.map((p) => p.user_id))];

      const [{ data: reviews }, { data: portfolio }, { data: services }, { data: profiles }] =
        await Promise.all([
          db.from("professional_reviews").select("professional_id, rating").in("professional_id", ids),
          db
            .from("portfolio_items")
            .select("*")
            .in("professional_id", ids)
            .order("sort_order"),
          db
            .from("professional_services")
            .select("professional_id, price_from_cents")
            .in("professional_id", ids),
          db.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
        ]);

      const nameMap = new Map(
        (
          (profiles ?? []) as {
            user_id: string;
            display_name: string | null;
            avatar_url: string | null;
          }[]
        ).map((p) => [p.user_id, p]),
      );


      return pros.map((p) => {
        const rs = ((reviews ?? []) as { professional_id: string; rating: number }[]).filter(
          (r) => r.professional_id === p.id,
        );
        const rating_count = rs.length;
        const items = ((portfolio ?? []) as PortfolioEntry[]).filter(
          (i) => i.professional_id === p.id,
        );
        const prices = ((services ?? []) as { professional_id: string; price_from_cents: number | null }[])
          .filter((s) => s.professional_id === p.id && s.price_from_cents != null)
          .map((s) => s.price_from_cents as number);
        return {
          ...p,
          specialties: p.specialties ?? [],
          rating_avg: rating_count > 0 ? rs.reduce((a, r) => a + r.rating, 0) / rating_count : null,
          rating_count,
          portfolio_preview: items.slice(0, 3),
          portfolio_count: items.length,
          price_from_cents: prices.length > 0 ? Math.min(...prices) : null,
          display_name: nameMap.get(p.user_id)?.display_name ?? null,
          owner_avatar_url: nameMap.get(p.user_id)?.avatar_url ?? null,

        };
      });
    },
  });

// ===== Public detail =====
export async function getPublicProfessionalFull(userId: string) {
  const { data: profile, error } = await db
    .from("professional_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const [{ data: services }, { data: portfolio }, reviews, { data: owner }] = await Promise.all([
    db
      .from("professional_services")
      .select("*")
      .eq("professional_id", profile.id)
      .order("sort_order"),
    db.from("portfolio_items").select("*").eq("professional_id", profile.id).order("sort_order"),
    listProfessionalReviews(profile.id),
    db.from("profiles").select("display_name, avatar_url").eq("user_id", userId).maybeSingle(),
  ]);

  const rating_count = reviews.length;
  return {
    profile: {
      ...profile,
      specialties: profile.specialties ?? [],
    } as ProfessionalCardData,
    services: (services ?? []) as ProfessionalService[],
    portfolio: (portfolio ?? []) as PortfolioEntry[],
    reviews,
    rating_count,
    rating_avg:
      rating_count > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / rating_count : null,
    ownerName: (owner?.display_name as string | null) ?? null,
  };
}

// ===== Reviews =====
export async function listProfessionalReviews(professionalId: string): Promise<ProfessionalReview[]> {
  const { data, error } = await db
    .from("professional_reviews")
    .select("*")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const reviews = (data ?? []) as ProfessionalReview[];
  if (reviews.length === 0) return [];
  const userIds = [...new Set(reviews.map((r) => r.user_id))];
  const { data: profiles } = await db
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", userIds);
  const map = new Map(
    ((profiles ?? []) as { user_id: string; display_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.user_id, p],
    ),
  );
  return reviews.map((r) => ({ ...r, author: map.get(r.user_id) ?? null }));
}

export async function upsertProfessionalReview(input: {
  professional_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
}) {
  const { error } = await db
    .from("professional_reviews")
    .upsert(input, { onConflict: "professional_id,user_id" });
  if (error) throw error;
}

export async function removeProfessionalReview(id: string) {
  const { error } = await db.from("professional_reviews").delete().eq("id", id);
  if (error) throw error;
}

// ===== Leads (pedidos de orçamento) =====
export async function createProfessionalLead(input: {
  professional_id: string;
  requester_id: string;
  description: string;
  budget_cents: number | null;
  contact_whatsapp: string | null;
}) {
  const { error } = await db.from("professional_leads").insert(input);
  if (error) throw error;
}

export async function listProfessionalLeads(professionalId: string): Promise<ProfessionalLead[]> {
  const { data, error } = await db
    .from("professional_leads")
    .select("*")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const leads = (data ?? []) as ProfessionalLead[];
  if (leads.length === 0) return [];
  const userIds = [...new Set(leads.map((l) => l.requester_id))];
  const { data: profiles } = await db
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", userIds);
  const map = new Map(
    ((profiles ?? []) as { user_id: string; display_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.user_id, p],
    ),
  );
  return leads.map((l) => ({ ...l, requester: map.get(l.requester_id) ?? null }));
}

export async function updateLeadStatus(id: string, status: ProfessionalLead["status"]) {
  const { error } = await db.from("professional_leads").update({ status }).eq("id", id);
  if (error) throw error;
}

// ===== Portfolio =====
export async function listPortfolio(professionalId: string): Promise<PortfolioEntry[]> {
  const { data, error } = await db
    .from("portfolio_items")
    .select("*")
    .eq("professional_id", professionalId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as PortfolioEntry[];
}

export async function updatePortfolioItem(id: string, payload: Partial<PortfolioEntry>) {
  const { error } = await db.from("portfolio_items").update(payload).eq("id", id);
  if (error) throw error;
}

export async function movePortfolioItem(items: PortfolioEntry[], id: string, dir: -1 | 1) {
  const index = items.findIndex((i) => i.id === id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= items.length) return;
  const a = items[index];
  const b = items[target];
  await Promise.all([
    updatePortfolioItem(a.id, { sort_order: b.sort_order }),
    updatePortfolioItem(b.id, { sort_order: a.sort_order }),
  ]);
}

// ===== Counters =====
export async function trackProfessionalView(professionalId: string) {
  await db.rpc("increment_professional_view", { _professional_id: professionalId });
}

export async function trackProfessionalWhatsapp(professionalId: string) {
  await db.rpc("increment_professional_whatsapp_click", { _professional_id: professionalId });
}

export function formatPrice(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}
