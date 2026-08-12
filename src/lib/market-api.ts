import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MarketCondition = "novo" | "seminovo" | "usado";
export type MarketStatus = "active" | "reserved" | "sold" | "paused";
export type OfferStatus = "pending" | "accepted" | "rejected";

export const CONDITION_LABELS: Record<MarketCondition, string> = {
  novo: "Novo",
  seminovo: "Seminovo",
  usado: "Usado",
};

export const MARKET_STATUS_LABELS: Record<MarketStatus, string> = {
  active: "À venda",
  reserved: "Reservado",
  sold: "Vendido",
  paused: "Pausado",
};

export const MARKET_CATEGORIES = [
  "eletronicos",
  "moveis",
  "eletrodomesticos",
  "moda",
  "infantil",
  "ferramentas",
  "veiculos",
  "outros",
] as const;

export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

export const MARKET_CATEGORY_LABELS: Record<string, string> = {
  eletronicos: "Eletrônicos",
  moveis: "Móveis",
  eletrodomesticos: "Eletrodomésticos",
  moda: "Moda",
  infantil: "Infantil",
  ferramentas: "Ferramentas",
  veiculos: "Veículos",
  outros: "Outros",
};

export type MarketItem = {
  id: string;
  seller_id: string;
  community_id: string | null;
  title: string;
  description: string;
  price_cents: number | null;
  is_negotiable: boolean;
  condition: MarketCondition;
  category: string;
  images: string[];
  status: MarketStatus;
  created_at: string;
  updated_at: string;
  community?: { name: string; slug: string } | null;
};

export type MarketOffer = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  message: string | null;
  status: OfferStatus;
  created_at: string;
};

export type MarketConversation = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
};

export type MarketMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type PublicProfile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function formatBRL(cents: number | null | undefined) {
  if (cents == null) return "Sob consulta";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// --- Queries ---
export const marketItemsQuery = (opts: {
  communitySlug?: string;
  category?: string;
  q?: string;
}) =>
  queryOptions({
    queryKey: ["market-items", opts.communitySlug ?? "all", opts.category ?? "all", opts.q ?? ""],
    queryFn: async (): Promise<MarketItem[]> => {
      let communityId: string | null = null;
      if (opts.communitySlug) {
        const { data } = await supabase
          .from("communities")
          .select("id")
          .eq("slug", opts.communitySlug)
          .maybeSingle();
        communityId = data?.id ?? null;
        if (!communityId) return [];
      }
      let query = supabase
        .from("market_items")
        .select("*, community:communities(name, slug)")
        .in("status", ["active", "reserved"])
        .order("created_at", { ascending: false })
        .limit(60);
      if (communityId) query = query.eq("community_id", communityId);
      if (opts.category) query = query.eq("category", opts.category);
      if (opts.q) query = query.ilike("title", `%${opts.q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MarketItem[];
    },
  });

export const marketItemQuery = (id: string) =>
  queryOptions({
    queryKey: ["market-item", id],
    queryFn: async (): Promise<MarketItem | null> => {
      const { data, error } = await supabase
        .from("market_items")
        .select("*, community:communities(name, slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as MarketItem | null;
    },
  });

export const myMarketItemsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-market-items", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<MarketItem[]> => {
      const { data, error } = await supabase
        .from("market_items")
        .select("*, community:communities(name, slug)")
        .eq("seller_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MarketItem[];
    },
  });

export const itemOffersQuery = (itemId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["market-offers", itemId],
    enabled,
    queryFn: async (): Promise<MarketOffer[]> => {
      const { data, error } = await supabase
        .from("market_offers")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MarketOffer[];
    },
  });

export const myOffersQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-offers", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<MarketOffer[]> => {
      const { data, error } = await supabase
        .from("market_offers")
        .select("*")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MarketOffer[];
    },
  });

export async function fetchProfiles(userIds: string[]): Promise<Record<string, PublicProfile>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", unique);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((p) => [p.user_id, p as PublicProfile]));
}

export const conversationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["market-conversations", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_conversations")
        .select("*, item:market_items(id, title, images, price_cents, status, seller_id)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const convos = (data ?? []) as unknown as (MarketConversation & {
        item: Pick<MarketItem, "id" | "title" | "images" | "price_cents" | "status" | "seller_id"> | null;
      })[];
      const others = convos.map((c) => (c.buyer_id === userId ? c.seller_id : c.buyer_id));
      const profiles = await fetchProfiles(others);
      return convos.map((c) => ({
        ...c,
        other: profiles[c.buyer_id === userId ? c.seller_id : c.buyer_id] ?? null,
      }));
    },
  });

export const conversationQuery = (id: string) =>
  queryOptions({
    queryKey: ["market-conversation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_conversations")
        .select("*, item:market_items(id, title, images, price_cents, status, seller_id)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as
        | (MarketConversation & {
            item: Pick<MarketItem, "id" | "title" | "images" | "price_cents" | "status" | "seller_id"> | null;
          })
        | null;
    },
  });

export const messagesQuery = (conversationId: string) =>
  queryOptions({
    queryKey: ["market-messages", conversationId],
    queryFn: async (): Promise<MarketMessage[]> => {
      const { data, error } = await supabase
        .from("market_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MarketMessage[];
    },
  });

// --- Mutations ---
export async function startConversation(item: {
  id: string;
  seller_id: string;
}, buyerId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("market_conversations")
    .select("id")
    .eq("item_id", item.id)
    .eq("buyer_id", buyerId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("market_conversations")
    .insert({ item_id: item.id, buyer_id: buyerId, seller_id: item.seller_id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await supabase
    .from("market_messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw error;
}

export async function markMessagesRead(conversationId: string, userId: string) {
  await supabase
    .from("market_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export async function createOffer(params: {
  itemId: string;
  buyerId: string;
  sellerId: string;
  amountCents: number;
  message?: string;
}) {
  const { error } = await supabase.from("market_offers").insert({
    item_id: params.itemId,
    buyer_id: params.buyerId,
    seller_id: params.sellerId,
    amount_cents: params.amountCents,
    message: params.message ?? null,
  });
  if (error) throw error;
}

export async function respondOffer(offerId: string, status: Exclude<OfferStatus, "pending">) {
  const { error } = await supabase.from("market_offers").update({ status }).eq("id", offerId);
  if (error) throw error;
}
