import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Scope } from "./listings-api";
import type { Business, BusinessHour } from "./account-api";

const db = supabase as any;

export const BUSINESS_CATEGORIES = [
  { value: "alimentacao", label: "Alimentação", emoji: "🍔" },
  { value: "mercado", label: "Mercado e açougue", emoji: "🛒" },
  { value: "beleza", label: "Beleza e estética", emoji: "💈" },
  { value: "saude", label: "Saúde e farmácia", emoji: "💊" },
  { value: "moda", label: "Moda e acessórios", emoji: "👕" },
  { value: "varejo", label: "Varejo e loja", emoji: "🏪" },
  { value: "servicos", label: "Serviços", emoji: "🔧" },
  { value: "pet", label: "Pet", emoji: "🐶" },
  { value: "educacao", label: "Educação", emoji: "📚" },
  { value: "outros", label: "Outros", emoji: "✨" },
] as const;

export function businessCategoryLabel(value: string | null): string {
  return BUSINESS_CATEGORIES.find((c) => c.value === value)?.label ?? "Outros";
}

export type BusinessReview = {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null } | null;
};

export type BusinessPromotion = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  discount_label: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
};

export type BusinessCardData = Business & {
  created_at: string;
  view_count: number;
  whatsapp_click_count: number;
  rating_avg: number | null;
  rating_count: number;
  hours: BusinessHour[];
  promo_count: number;
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
  const { data: cities, error: e3 } = await db
    .from("cities")
    .select("id")
    .eq("state_id", state.id);
  if (e3) throw e3;
  const cityIds = (cities ?? []).map((c: { id: string }) => c.id);
  if (cityIds.length === 0) return [];
  const { data, error } = await db.from("communities").select("id").in("city_id", cityIds);
  if (error) throw error;
  return (data ?? []).map((c: { id: string }) => c.id);
}

export const businessesByScopeQuery = (scope: Scope) =>
  queryOptions({
    queryKey: ["businesses", scope.kind, scope.slug],
    queryFn: async (): Promise<BusinessCardData[]> => {
      const communityIds = await communityIdsForScope(scope);
      if (communityIds.length === 0) return [];
      const { data, error } = await db
        .from("businesses")
        .select("*")
        .in("community_id", communityIds)
        .eq("is_published", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const businesses = (data ?? []) as (Business & {
        created_at: string;
        view_count: number;
        whatsapp_click_count: number;
      })[];
      if (businesses.length === 0) return [];
      const ids = businesses.map((b) => b.id);

      const [{ data: reviews }, { data: hours }, { data: promos }] = await Promise.all([
        db.from("business_reviews").select("business_id, rating").in("business_id", ids),
        db.from("business_hours").select("*").in("business_id", ids),
        db
          .from("business_promotions")
          .select("business_id, is_active, ends_at")
          .in("business_id", ids)
          .eq("is_active", true),
      ]);

      const now = new Date().toISOString();
      return businesses.map((b) => {
        const rs = ((reviews ?? []) as { business_id: string; rating: number }[]).filter(
          (r) => r.business_id === b.id,
        );
        const rating_count = rs.length;
        const rating_avg =
          rating_count > 0 ? rs.reduce((a, r) => a + r.rating, 0) / rating_count : null;
        return {
          ...b,
          rating_avg,
          rating_count,
          hours: ((hours ?? []) as BusinessHour[]).filter((h) => h.business_id === b.id),
          promo_count: ((promos ?? []) as { business_id: string; ends_at: string | null }[]).filter(
            (p) => p.business_id === b.id && (!p.ends_at || p.ends_at > now),
          ).length,
        };
      });
    },
  });

// ===== Open now =====
export function isOpenNow(hours: BusinessHour[], at = new Date()): boolean | null {
  if (!hours || hours.length === 0) return null;
  const today = hours.find((h) => h.weekday === at.getDay());
  if (!today || today.is_closed || !today.opens_at || !today.closes_at) return false;
  const cur = at.getHours() * 60 + at.getMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const open = toMin(today.opens_at);
  const close = toMin(today.closes_at);
  if (close <= open) return cur >= open || cur <= close; // crosses midnight
  return cur >= open && cur <= close;
}

// ===== Reviews =====
export async function listBusinessReviews(businessId: string): Promise<BusinessReview[]> {
  const { data, error } = await db
    .from("business_reviews")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const reviews = (data ?? []) as BusinessReview[];
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

export async function upsertBusinessReview(input: {
  business_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
}) {
  const { error } = await db
    .from("business_reviews")
    .upsert(input, { onConflict: "business_id,user_id" });
  if (error) throw error;
}

export async function removeBusinessReview(id: string) {
  const { error } = await db.from("business_reviews").delete().eq("id", id);
  if (error) throw error;
}

// ===== Promotions =====
export async function listBusinessPromotions(
  businessId: string,
  onlyActive = false,
): Promise<BusinessPromotion[]> {
  let q = db
    .from("business_promotions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (onlyActive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  const list = (data ?? []) as BusinessPromotion[];
  if (!onlyActive) return list;
  const now = Date.now();
  return list.filter((p) => !p.ends_at || new Date(p.ends_at).getTime() > now);
}

export async function addBusinessPromotion(
  p: Omit<BusinessPromotion, "id" | "starts_at"> & { starts_at?: string },
) {
  const { error } = await db.from("business_promotions").insert(p);
  if (error) throw error;
}

export async function removeBusinessPromotion(id: string) {
  const { error } = await db.from("business_promotions").delete().eq("id", id);
  if (error) throw error;
}

export async function togglePromotionActive(id: string, is_active: boolean) {
  const { error } = await db.from("business_promotions").update({ is_active }).eq("id", id);
  if (error) throw error;
}

// ===== Favorites =====
export async function listFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await db
    .from("business_favorites")
    .select("business_id")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data ?? []) as { business_id: string }[]).map((f) => f.business_id);
}

export async function addFavorite(userId: string, businessId: string) {
  const { error } = await db
    .from("business_favorites")
    .insert({ user_id: userId, business_id: businessId });
  if (error) throw error;
}

export async function removeFavorite(userId: string, businessId: string) {
  const { error } = await db
    .from("business_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("business_id", businessId);
  if (error) throw error;
}

// ===== Counters =====
export async function trackBusinessView(businessId: string) {
  await db.rpc("increment_business_view", { _business_id: businessId });
}

export async function trackWhatsappClick(businessId: string) {
  await db.rpc("increment_business_whatsapp_click", { _business_id: businessId });
}
