import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Scope } from "./listings-api";
import { fetchProfiles, type PublicProfile } from "./market-api";

// types.ts may lag behind the migration; keep the client loose here.
const db = supabase as any;

export type GigStatus = "open" | "in_progress" | "completed" | "cancelled";
export type GigBudgetType = "fixed" | "hourly" | "negotiable";
export type GigApplicationStatus =
  | "sent"
  | "seen"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "withdrawn";

export const GIG_STATUS_LABELS: Record<GigStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const GIG_BUDGET_TYPE_LABELS: Record<GigBudgetType, string> = {
  fixed: "Valor fechado",
  hourly: "Por hora",
  negotiable: "A combinar",
};

export const APPLICATION_STATUS_LABELS: Record<GigApplicationStatus, string> = {
  sent: "Enviada",
  seen: "Vista",
  shortlisted: "Pré-selecionada",
  accepted: "Aceita",
  rejected: "Recusada",
  withdrawn: "Retirada",
};

export const GIG_CATEGORIES = [
  { value: "limpeza", label: "Limpeza", emoji: "🧹" },
  { value: "mudanca", label: "Mudança / carreto", emoji: "🚚" },
  { value: "montagem", label: "Montagem", emoji: "🔧" },
  { value: "pintura", label: "Pintura", emoji: "🎨" },
  { value: "jardinagem", label: "Jardinagem", emoji: "🌿" },
  { value: "entregas", label: "Entregas", emoji: "🛵" },
  { value: "eventos", label: "Eventos", emoji: "🎉" },
  { value: "cuidados", label: "Cuidados", emoji: "🤲" },
  { value: "tecnologia", label: "Tecnologia", emoji: "💻" },
  { value: "outros", label: "Outros", emoji: "✨" },
] as const;

export const GIG_REQUIREMENTS = [
  "Tem carro",
  "Tem moto",
  "Leva ferramentas",
  "Força física",
  "Experiência na área",
  "Disponível no fim de semana",
];

export function gigCategoryLabel(value: string | null | undefined) {
  return GIG_CATEGORIES.find((c) => c.value === value)?.label ?? "Outros";
}

export function gigCategoryEmoji(value: string | null | undefined) {
  return GIG_CATEGORIES.find((c) => c.value === value)?.emoji ?? "✨";
}

export type Gig = {
  id: string;
  owner_id: string;
  community_id: string | null;
  title: string;
  description: string;
  category: string;
  images: string[];
  budget_cents: number | null;
  budget_type: GigBudgetType;
  is_negotiable: boolean;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_hours: number | null;
  address_hint: string | null;
  is_urgent: boolean;
  requirements: string[];
  status: GigStatus;
  assigned_user_id: string | null;
  applications_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  community?: { name: string; slug: string } | null;
};

export type GigApplication = {
  id: string;
  gig_id: string;
  applicant_id: string;
  message: string | null;
  proposed_cents: number | null;
  available_at: string | null;
  status: GigApplicationStatus;
  created_at: string;
  updated_at: string;
};

export type GigApplicationWithProfile = GigApplication & {
  profile: PublicProfile | null;
  rating_avg: number | null;
  rating_count: number;
  completed_gigs: number;
};

export type GigConversation = {
  id: string;
  gig_id: string;
  application_id: string | null;
  owner_id: string;
  applicant_id: string;
  last_message_at: string;
  created_at: string;
};

export type GigMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type GigReview = {
  id: string;
  gig_id: string;
  reviewer_id: string;
  reviewee_id: string;
  role: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export function formatBudget(gig: Pick<Gig, "budget_cents" | "budget_type">) {
  if (gig.budget_type === "negotiable" || gig.budget_cents == null) return "A combinar";
  const value = (gig.budget_cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return gig.budget_type === "hourly" ? `${value}/hora` : value;
}

export function formatGigDate(gig: Pick<Gig, "scheduled_date" | "scheduled_time">) {
  if (!gig.scheduled_date) return "Data a combinar";
  const [y, m, d] = gig.scheduled_date.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  const label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const time = gig.scheduled_time ? ` às ${gig.scheduled_time.slice(0, 5)}` : "";
  return `${label}${time}`;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

async function communityIdsForScope(scope: Scope): Promise<string[]> {
  if (scope.kind === "community") {
    const { data } = await db.from("communities").select("id").eq("slug", scope.slug);
    return (data ?? []).map((c: { id: string }) => c.id);
  }
  if (scope.kind === "city") {
    const { data: city } = await db
      .from("cities")
      .select("id")
      .eq("slug", scope.slug)
      .maybeSingle();
    if (!city) return [];
    const { data } = await db.from("communities").select("id").eq("city_id", city.id);
    return (data ?? []).map((c: { id: string }) => c.id);
  }
  const { data: state } = await db.from("states").select("id").eq("slug", scope.slug).maybeSingle();
  if (!state) return [];
  const { data: cities } = await db.from("cities").select("id").eq("state_id", state.id);
  const cityIds = (cities ?? []).map((c: { id: string }) => c.id);
  if (cityIds.length === 0) return [];
  const { data } = await db.from("communities").select("id").in("city_id", cityIds);
  return (data ?? []).map((c: { id: string }) => c.id);
}

// --- Queries ---
export const gigsByScopeQuery = (scope: Scope) =>
  queryOptions({
    queryKey: ["gigs", scope.kind, scope.slug],
    queryFn: async (): Promise<Gig[]> => {
      const ids = await communityIdsForScope(scope);
      if (ids.length === 0) return [];
      const { data, error } = await db
        .from("gigs")
        .select("*, community:communities(name, slug)")
        .in("community_id", ids)
        .in("status", ["open", "in_progress"])
        .order("is_urgent", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Gig[];
    },
  });

export const gigQuery = (id: string) =>
  queryOptions({
    queryKey: ["gig", id],
    queryFn: async (): Promise<Gig | null> => {
      const { data, error } = await db
        .from("gigs")
        .select("*, community:communities(name, slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Gig | null;
    },
  });

export const myGigsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-gigs", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<Gig[]> => {
      const { data, error } = await db
        .from("gigs")
        .select("*, community:communities(name, slug)")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Gig[];
    },
  });

export const myApplicationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-gig-applications", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("gig_applications")
        .select("*, gig:gigs(id, title, status, budget_cents, budget_type, scheduled_date, scheduled_time, owner_id)")
        .eq("applicant_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (GigApplication & { gig: Gig | null })[];
    },
  });

export const myApplicationForGigQuery = (gigId: string, userId: string | undefined) =>
  queryOptions({
    queryKey: ["gig-application", gigId, userId ?? "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<GigApplication | null> => {
      const { data, error } = await db
        .from("gig_applications")
        .select("*")
        .eq("gig_id", gigId)
        .eq("applicant_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as GigApplication | null;
    },
  });

export const gigApplicationsQuery = (gigId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["gig-applications", gigId],
    enabled,
    queryFn: async (): Promise<GigApplicationWithProfile[]> => {
      const { data, error } = await db
        .from("gig_applications")
        .select("*")
        .eq("gig_id", gigId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const apps = (data ?? []) as GigApplication[];
      if (apps.length === 0) return [];
      const ids = apps.map((a) => a.applicant_id);
      const [profiles, reputation] = await Promise.all([
        fetchProfiles(ids),
        fetchReputation(ids),
      ]);
      return apps.map((a) => ({
        ...a,
        profile: profiles[a.applicant_id] ?? null,
        rating_avg: reputation[a.applicant_id]?.avg ?? null,
        rating_count: reputation[a.applicant_id]?.count ?? 0,
        completed_gigs: reputation[a.applicant_id]?.completed ?? 0,
      }));
    },
  });

export async function fetchReputation(userIds: string[]) {
  const unique = [...new Set(userIds)].filter(Boolean);
  const out: Record<string, { avg: number | null; count: number; completed: number }> = {};
  if (unique.length === 0) return out;
  const [{ data: reviews }, { data: done }] = await Promise.all([
    db.from("gig_reviews").select("reviewee_id, rating").in("reviewee_id", unique),
    db.from("gigs").select("assigned_user_id").in("assigned_user_id", unique).eq("status", "completed"),
  ]);
  for (const id of unique) out[id] = { avg: null, count: 0, completed: 0 };
  for (const r of (reviews ?? []) as { reviewee_id: string; rating: number }[]) {
    const entry = out[r.reviewee_id]!;
    entry.avg = ((entry.avg ?? 0) * entry.count + r.rating) / (entry.count + 1);
    entry.count += 1;
  }
  for (const g of (done ?? []) as { assigned_user_id: string }[]) {
    if (out[g.assigned_user_id]) out[g.assigned_user_id]!.completed += 1;
  }
  return out;
}

export const gigReviewsQuery = (gigId: string) =>
  queryOptions({
    queryKey: ["gig-reviews", gigId],
    queryFn: async (): Promise<GigReview[]> => {
      const { data, error } = await db.from("gig_reviews").select("*").eq("gig_id", gigId);
      if (error) throw error;
      return (data ?? []) as GigReview[];
    },
  });

export const gigConversationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["gig-conversations", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("gig_conversations")
        .select("*, gig:gigs(id, title, images, budget_cents, budget_type, status)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const convos = ((data ?? []) as (GigConversation & { gig: Gig | null })[]).filter(
        (c) => c.owner_id !== c.applicant_id,
      );
      const others = convos.map((c) => (c.owner_id === userId ? c.applicant_id : c.owner_id));
      const profiles = await fetchProfiles(others);
      return convos.map((c) => ({
        ...c,
        other: profiles[c.owner_id === userId ? c.applicant_id : c.owner_id] ?? null,
      }));
    },
  });

export const gigConversationQuery = (id: string) =>
  queryOptions({
    queryKey: ["gig-conversation", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("gig_conversations")
        .select("*, gig:gigs(id, title, images, budget_cents, budget_type, status)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as (GigConversation & { gig: Gig | null }) | null;
    },
  });

export const gigMessagesQuery = (conversationId: string) =>
  queryOptions({
    queryKey: ["gig-messages", conversationId],
    queryFn: async (): Promise<GigMessage[]> => {
      const { data, error } = await db
        .from("gig_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GigMessage[];
    },
  });

// --- Mutations ---
export async function createGig(
  ownerId: string,
  payload: Partial<Gig> & { title: string; description: string },
): Promise<Gig> {
  const { data, error } = await db
    .from("gigs")
    .insert({ ...payload, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  return data as Gig;
}

export async function updateGig(id: string, payload: Partial<Gig>) {
  const { error } = await db.from("gigs").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteGig(id: string) {
  const { error } = await db.from("gigs").delete().eq("id", id);
  if (error) throw error;
}

export async function trackGigView(id: string) {
  await db.rpc("increment_gig_view", { _gig_id: id });
}

export async function applyToGig(params: {
  gigId: string;
  applicantId: string;
  message: string;
  proposedCents: number | null;
  availableAt: string | null;
}) {
  const { data: gigRow } = await db.from("gigs").select("owner_id").eq("id", params.gigId).maybeSingle();
  if (gigRow?.owner_id === params.applicantId) {
    throw new Error("Você não pode se candidatar ao seu próprio bico");
  }
  const { error } = await db.from("gig_applications").insert({
    gig_id: params.gigId,
    applicant_id: params.applicantId,
    message: params.message || null,
    proposed_cents: params.proposedCents,
    available_at: params.availableAt,
  });
  if (error) throw error;
}

export async function withdrawApplication(id: string) {
  const { error } = await db.from("gig_applications").update({ status: "withdrawn" }).eq("id", id);
  if (error) throw error;
}

export async function setApplicationStatus(id: string, status: GigApplicationStatus) {
  const { error } = await db.from("gig_applications").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function acceptApplication(app: GigApplication) {
  const { error } = await db
    .from("gig_applications")
    .update({ status: "accepted" })
    .eq("id", app.id);
  if (error) throw error;
  await db
    .from("gig_applications")
    .update({ status: "rejected" })
    .eq("gig_id", app.gig_id)
    .neq("id", app.id)
    .in("status", ["sent", "seen", "shortlisted"]);
  await db
    .from("gigs")
    .update({ status: "in_progress", assigned_user_id: app.applicant_id })
    .eq("id", app.gig_id);
}

export async function completeGig(gigId: string) {
  const { error } = await db.from("gigs").update({ status: "completed" }).eq("id", gigId);
  if (error) throw error;
}

export const CHAT_ENABLED_APPLICATION_STATUSES: GigApplicationStatus[] = [
  "shortlisted",
  "accepted",
];

export function canApplicantChat(status?: GigApplicationStatus | null) {
  return !!status && CHAT_ENABLED_APPLICATION_STATUSES.includes(status);
}

export async function startGigConversation(params: {
  gigId: string;
  ownerId: string;
  applicantId: string;
  applicationId?: string | null;
  /** Quando quem abre é o candidato, exigimos pré-seleção/aceite */
  asApplicantStatus?: GigApplicationStatus | null;
}): Promise<string> {
  if (params.ownerId === params.applicantId) {
    throw new Error("Você não pode conversar com você mesmo");
  }
  if (params.asApplicantStatus !== undefined && !canApplicantChat(params.asApplicantStatus)) {
    throw new Error(
      "Você poderá conversar com o anunciante assim que for pré-selecionado ou escolhido",
    );
  }
  const { data: existing } = await db
    .from("gig_conversations")
    .select("id")
    .eq("gig_id", params.gigId)
    .eq("applicant_id", params.applicantId)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await db
    .from("gig_conversations")
    .insert({
      gig_id: params.gigId,
      owner_id: params.ownerId,
      applicant_id: params.applicantId,
      application_id: params.applicationId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function sendGigMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await db
    .from("gig_messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw error;
}

export async function markGigMessagesRead(conversationId: string, userId: string) {
  await db
    .from("gig_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export async function submitGigReview(params: {
  gigId: string;
  reviewerId: string;
  revieweeId: string;
  role: "contratante" | "freelancer";
  rating: number;
  comment: string | null;
}) {
  const { error } = await db.from("gig_reviews").upsert(
    {
      gig_id: params.gigId,
      reviewer_id: params.reviewerId,
      reviewee_id: params.revieweeId,
      role: params.role,
      rating: params.rating,
      comment: params.comment,
    },
    { onConflict: "gig_id,reviewer_id" },
  );
  if (error) throw error;
}
