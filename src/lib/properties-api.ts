import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Scope } from "./listings-api";

export type PropertyPurpose = "aluguel" | "venda";
export type PropertyKind =
  | "casa"
  | "apartamento"
  | "kitnet"
  | "quarto"
  | "terreno"
  | "comercial";
export type PropertyStatus = "active" | "reserved" | "rented" | "sold" | "paused";

export const PURPOSE_LABELS: Record<PropertyPurpose, string> = {
  aluguel: "Aluguel",
  venda: "Venda",
};

export const KIND_LABELS: Record<PropertyKind, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  kitnet: "Kitnet",
  quarto: "Quarto",
  terreno: "Terreno",
  comercial: "Comercial",
};

export const PROPERTY_KINDS = Object.keys(KIND_LABELS) as PropertyKind[];

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  active: "Disponível",
  reserved: "Reservado",
  rented: "Alugado",
  sold: "Vendido",
  paused: "Pausado",
};

export type Property = {
  id: string;
  owner_id: string;
  community_id: string | null;
  title: string;
  description: string;
  purpose: PropertyPurpose;
  kind: PropertyKind;
  price_cents: number | null;
  condo_cents: number | null;
  iptu_cents: number | null;
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  area_m2: number | null;
  is_furnished: boolean;
  accepts_pets: boolean;
  address_hint: string | null;
  address: string | null;
  images: string[];
  whatsapp: string | null;
  phone: string | null;
  status: PropertyStatus;
  is_published: boolean;
  view_count: number;
  whatsapp_click_count: number;
  created_at: string;
  updated_at: string;
  community?: { name: string; slug: string } | null;
};

export function formatPrice(p: Pick<Property, "price_cents" | "purpose">) {
  if (p.price_cents == null) return "Sob consulta";
  const value = (p.price_cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
  return p.purpose === "aluguel" ? `${value}/mês` : value;
}

export function formatMoney(cents: number | null | undefined) {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

const SELECT = "*, community:communities(name, slug)";

async function communityIdsForScope(scope: Scope): Promise<string[]> {
  if (scope.kind === "community") {
    const { data } = await supabase.from("communities").select("id").eq("slug", scope.slug);
    return (data ?? []).map((c) => c.id);
  }
  if (scope.kind === "city") {
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", scope.slug)
      .maybeSingle();
    if (!city) return [];
    const { data } = await supabase.from("communities").select("id").eq("city_id", city.id);
    return (data ?? []).map((c) => c.id);
  }
  const { data: state } = await supabase
    .from("states")
    .select("id")
    .eq("slug", scope.slug)
    .maybeSingle();
  if (!state) return [];
  const { data: cities } = await supabase.from("cities").select("id").eq("state_id", state.id);
  const cityIds = (cities ?? []).map((c) => c.id);
  if (cityIds.length === 0) return [];
  const { data } = await supabase.from("communities").select("id").in("city_id", cityIds);
  return (data ?? []).map((c) => c.id);
}

export const propertiesByScopeQuery = (scope: Scope) =>
  queryOptions({
    queryKey: ["properties", scope.kind, scope.slug],
    queryFn: async (): Promise<Property[]> => {
      const ids = await communityIdsForScope(scope);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("properties")
        .select(SELECT)
        .eq("is_published", true)
        .in("status", ["active", "reserved"])
        .in("community_id", ids)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Property[];
    },
  });

export const propertyQuery = (id: string) =>
  queryOptions({
    queryKey: ["property", id],
    queryFn: async (): Promise<Property | null> => {
      const { data, error } = await supabase
        .from("properties")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Property | null;
    },
  });

export const myPropertiesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-properties", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select(SELECT)
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Property[];
    },
  });

export const favoritePropertyIdsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["property-favorites", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("property_favorites")
        .select("property_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.property_id);
    },
  });

export type NewProperty = {
  title: string;
  description: string;
  purpose: PropertyPurpose;
  kind: PropertyKind;
  price_cents: number | null;
  condo_cents: number | null;
  iptu_cents: number | null;
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  area_m2: number | null;
  is_furnished: boolean;
  accepts_pets: boolean;
  address_hint: string | null;
  address: string | null;
  images: string[];
  whatsapp: string | null;
  phone: string | null;
  community_id: string | null;
};

export async function createProperty(ownerId: string, input: NewProperty): Promise<Property> {
  const { data, error } = await supabase
    .from("properties")
    .insert({ ...input, owner_id: ownerId })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Property;
}

export async function updateProperty(id: string, patch: Partial<NewProperty> & {
  status?: PropertyStatus;
  is_published?: boolean;
}) {
  const { error } = await supabase.from("properties").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteProperty(id: string) {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}

export async function togglePropertyFavorite(
  userId: string,
  propertyId: string,
  isFavorite: boolean,
) {
  if (isFavorite) {
    const { error } = await supabase
      .from("property_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("property_id", propertyId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("property_favorites")
      .insert({ user_id: userId, property_id: propertyId });
    if (error) throw error;
  }
}

export async function trackPropertyView(id: string) {
  await supabase.rpc("increment_property_view", { _property_id: id });
}

export async function trackPropertyWhatsapp(id: string) {
  await supabase.rpc("increment_property_whatsapp_click", { _property_id: id });
}

export function whatsappLink(number: string | null, message: string) {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}
