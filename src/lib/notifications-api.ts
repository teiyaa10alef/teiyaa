import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link_path: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export const notificationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
  });

export const unreadMessagesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["unread-messages", userId],
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const [market, gigs] = await Promise.all([
        supabase
          .from("market_messages")
          .select("id", { count: "exact", head: true })
          .is("read_at", null)
          .neq("sender_id", userId!),
        supabase
          .from("gig_messages")
          .select("id", { count: "exact", head: true })
          .is("read_at", null)
          .neq("sender_id", userId!),
      ]);
      return (market.count ?? 0) + (gigs.count ?? 0);
    },
  });

export async function markNotificationRead(id: string) {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
}

export async function markAllNotificationsRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export function notificationVisual(type: string): { emoji: string; tone: string } {
  if (type.startsWith("market")) return { emoji: "📦", tone: "bg-brand-soft text-brand" };
  if (type.startsWith("gig")) return { emoji: "🔥", tone: "bg-cat-freelance-soft text-cat-freelance" };
  if (type.startsWith("business")) return { emoji: "🏪", tone: "bg-brand-soft text-brand" };
  if (type.startsWith("professional")) return { emoji: "🛠️", tone: "bg-muted text-foreground" };
  return { emoji: "🔔", tone: "bg-muted text-foreground" };
}

export function timeAgoShort(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
