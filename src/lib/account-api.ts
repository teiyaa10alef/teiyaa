import { supabase } from "@/integrations/supabase/client";

// Local types (kept loose so we don't depend on regenerated types.ts)
export type ProfessionalProfile = {
  id: string;
  user_id: string;
  community_id: string | null;
  profession: string;
  headline: string | null;
  about: string | null;
  years_experience: number | null;
  service_area_km: number | null;
  whatsapp: string | null;
  phone: string | null;
  instagram: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_published: boolean;
};

export type ProfessionalService = {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  price_from_cents: number | null;
  price_unit: string | null;
  sort_order: number;
};

export type PortfolioItem = {
  id: string;
  professional_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  sort_order: number;
};

export type Business = {
  id: string;
  owner_id: string;
  community_id: string | null;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  whatsapp: string | null;
  phone: string | null;
  instagram: string | null;
  is_published: boolean;
};

export type BusinessHour = {
  id: string;
  business_id: string;
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

export type BusinessService = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  sort_order: number;
};

export type BusinessMedia = {
  id: string;
  business_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  sort_order: number;
};

// Cast helper to keep TS happy when types.ts hasn't regenerated yet
const db = supabase as any;

// ===== Professional =====
export async function getMyProfessionalProfile(userId: string): Promise<ProfessionalProfile | null> {
  const { data, error } = await db
    .from("professional_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfessionalProfile(
  userId: string,
  payload: Partial<ProfessionalProfile> & { profession: string },
): Promise<ProfessionalProfile> {
  const { data, error } = await db
    .from("professional_profiles")
    .upsert({ ...payload, user_id: userId }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  await db.from("profiles").update({ is_professional: true }).eq("user_id", userId);
  return data;
}

export async function listProfessionalServices(professionalId: string): Promise<ProfessionalService[]> {
  const { data, error } = await db
    .from("professional_services")
    .select("*")
    .eq("professional_id", professionalId)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function addProfessionalService(s: Omit<ProfessionalService, "id">) {
  const { error } = await db.from("professional_services").insert(s);
  if (error) throw error;
}

export async function removeProfessionalService(id: string) {
  const { error } = await db.from("professional_services").delete().eq("id", id);
  if (error) throw error;
}

export async function listPortfolioItems(professionalId: string): Promise<PortfolioItem[]> {
  const { data, error } = await db
    .from("portfolio_items")
    .select("*")
    .eq("professional_id", professionalId)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function addPortfolioItem(p: Omit<PortfolioItem, "id">) {
  const { error } = await db.from("portfolio_items").insert(p);
  if (error) throw error;
}

export async function removePortfolioItem(id: string) {
  const { error } = await db.from("portfolio_items").delete().eq("id", id);
  if (error) throw error;
}

export async function getPublicProfessional(userId: string) {
  const { data: profile, error } = await db
    .from("professional_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;
  const [services, portfolio] = await Promise.all([
    listProfessionalServices(profile.id),
    listPortfolioItems(profile.id),
  ]);
  return { profile: profile as ProfessionalProfile, services, portfolio };
}

export async function listProfessionalsByCommunity(communityId: string): Promise<ProfessionalProfile[]> {
  const { data, error } = await db
    .from("professional_profiles")
    .select("*")
    .eq("community_id", communityId)
    .eq("is_published", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ===== Businesses =====
export async function listMyBusinesses(userId: string): Promise<Business[]> {
  const { data, error } = await db
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBusiness(id: string): Promise<Business | null> {
  const { data, error } = await db.from("businesses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const { data, error } = await db
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createBusiness(ownerId: string, payload: Partial<Business> & { name: string; slug: string }): Promise<Business> {
  const { data, error } = await db
    .from("businesses")
    .insert({ ...payload, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  await db.from("profiles").update({ is_business: true }).eq("user_id", ownerId);
  return data;
}

export async function updateBusiness(id: string, payload: Partial<Business>): Promise<Business> {
  const { data, error } = await db.from("businesses").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBusiness(id: string) {
  const { error } = await db.from("businesses").delete().eq("id", id);
  if (error) throw error;
}

export async function listBusinessHours(businessId: string): Promise<BusinessHour[]> {
  const { data, error } = await db
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .order("weekday");
  if (error) throw error;
  return data ?? [];
}

export async function upsertBusinessHour(h: Partial<BusinessHour> & { business_id: string; weekday: number }) {
  const { error } = await db.from("business_hours").upsert(h, { onConflict: "business_id,weekday" });
  if (error) throw error;
}

export async function listBusinessServices(businessId: string): Promise<BusinessService[]> {
  const { data, error } = await db
    .from("business_services")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function addBusinessService(s: Omit<BusinessService, "id">) {
  const { error } = await db.from("business_services").insert(s);
  if (error) throw error;
}

export async function removeBusinessService(id: string) {
  const { error } = await db.from("business_services").delete().eq("id", id);
  if (error) throw error;
}

export async function listBusinessMedia(businessId: string): Promise<BusinessMedia[]> {
  const { data, error } = await db
    .from("business_media")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function addBusinessMedia(m: Omit<BusinessMedia, "id">) {
  const { error } = await db.from("business_media").insert(m);
  if (error) throw error;
}

export async function removeBusinessMedia(id: string) {
  const { error } = await db.from("business_media").delete().eq("id", id);
  if (error) throw error;
}

export async function listBusinessesByCommunity(communityId: string): Promise<Business[]> {
  const { data, error } = await db
    .from("businesses")
    .select("*")
    .eq("community_id", communityId)
    .eq("is_published", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
