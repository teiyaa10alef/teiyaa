import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ilikeOr, makePage, rangeFor, sanitizeTerm, type Page } from "./paging";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryKey } from "./community";

export type Scope =
  | { kind: "community"; slug: string }
  | { kind: "city"; slug: string }
  | { kind: "state"; slug: string };

export type Listing = {
  id: string;
  community_id: string;
  category: CategoryKey;
  subcategory: string | null;
  title: string;
  description: string;
  price_cents: number | null;
  contact_whatsapp: string | null;
  contact_phone: string | null;
  images: string[];
  created_at: string;
  community?: { name: string; slug: string } | null;
};

export type Community = {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
};

export type City = { id: string; name: string; slug: string; state_id: string };
export type State = { id: string; name: string; code: string; slug: string };

// --- Communities ---
export const communitiesQuery = queryOptions({
  queryKey: ["communities"],
  queryFn: async (): Promise<Community[]> => {
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("is_active", { ascending: false })
      .order("name");
    if (error) throw error;
    return data as Community[];
  },
});

export const communityBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["community", slug],
    queryFn: async (): Promise<Community | null> => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Community | null;
    },
  });

export const cityBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["city", slug],
    queryFn: async (): Promise<City | null> => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as City | null;
    },
  });

export const stateBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["state", slug],
    queryFn: async (): Promise<State | null> => {
      const { data, error } = await supabase
        .from("states")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as State | null;
    },
  });

// --- Listings by scope ---
async function communityIdsForScope(scope: Scope): Promise<string[]> {
  if (scope.kind === "community") {
    const { data, error } = await supabase
      .from("communities")
      .select("id")
      .eq("slug", scope.slug);
    if (error) throw error;
    return (data ?? []).map((c) => c.id);
  }
  if (scope.kind === "city") {
    const { data: city, error: cErr } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", scope.slug)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!city) return [];
    const { data, error } = await supabase
      .from("communities")
      .select("id")
      .eq("city_id", city.id);
    if (error) throw error;
    return (data ?? []).map((c) => c.id);
  }
  // state
  const { data: state, error: sErr } = await supabase
    .from("states")
    .select("id")
    .eq("slug", scope.slug)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!state) return [];
  const { data: cities, error: cErr } = await supabase
    .from("cities")
    .select("id")
    .eq("state_id", state.id);
  if (cErr) throw cErr;
  const cityIds = (cities ?? []).map((c) => c.id);
  if (cityIds.length === 0) return [];
  const { data, error } = await supabase
    .from("communities")
    .select("id")
    .in("city_id", cityIds);
  if (error) throw error;
  return (data ?? []).map((c) => c.id);
}

export const listingsQuery = (scope: Scope, category?: CategoryKey) =>
  queryOptions({
    queryKey: ["listings", scope.kind, scope.slug, category ?? "all"],
    queryFn: async (): Promise<Listing[]> => {
      const ids = await communityIdsForScope(scope);
      if (ids.length === 0) return [];
      let q = supabase
        .from("listings")
        .select("*, community:communities(name, slug)")
        .eq("status", "active")
        .in("community_id", ids)
        .order("created_at", { ascending: false })
        .limit(50);
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Listing[];
    },
  });

// ===== Paginated feed =====
export const listingsPagedQuery = (scope: Scope, category?: CategoryKey) =>
  infiniteQueryOptions({
    queryKey: ["listings-paged", scope.kind, scope.slug, category ?? "all"],
    initialPageParam: 0,
    getNextPageParam: (last: Page<Listing>) => last.nextPage,
    gcTime: 10 * 60_000,
    queryFn: async ({ pageParam }): Promise<Page<Listing>> => {
      const ids = await communityIdsForScope(scope);
      if (ids.length === 0) return { items: [], total: 0, nextPage: null };
      const [from, to] = rangeFor(pageParam as number);
      let q = (supabase as any)
        .from("listings")
        .select("*, community:communities(name, slug)", { count: "exact" })
        .eq("status", "active")
        .in("community_id", ids)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to);
      if (category) q = q.eq("category", category);
      const { data, error, count } = await q;
      if (error) throw error;
      return makePage((data ?? []) as unknown as Listing[], count, pageParam as number);
    },
  });
