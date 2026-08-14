import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Scope } from "./listings-api";
import { fetchProfiles, type PublicProfile } from "./market-api";

// types.ts may lag behind the migration; keep the client loose here.
const db = supabase as any;

export type JobStatus = "open" | "paused" | "closed";
export type JobContractType = "clt" | "pj" | "temporario" | "meio_periodo" | "estagio" | "autonomo";
export type JobWorkMode = "presencial" | "hibrido" | "remoto";
export type JobApplicationStatus =
  | "sent"
  | "seen"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "withdrawn";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: "Aberta",
  paused: "Pausada",
  closed: "Encerrada",
};

export const JOB_CONTRACT_LABELS: Record<JobContractType, string> = {
  clt: "CLT",
  pj: "PJ",
  temporario: "Temporário",
  meio_periodo: "Meio período",
  estagio: "Estágio",
  autonomo: "Autônomo",
};

export const JOB_WORK_MODE_LABELS: Record<JobWorkMode, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};

export const JOB_APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  sent: "Enviada",
  seen: "Vista",
  shortlisted: "Pré-selecionada",
  accepted: "Aceita",
  rejected: "Recusada",
  withdrawn: "Retirada",
};

export const JOB_AREAS = [
  { value: "comercio", label: "Comércio / loja", emoji: "🛍️" },
  { value: "alimentacao", label: "Alimentação", emoji: "🍔" },
  { value: "beleza", label: "Beleza", emoji: "💇" },
  { value: "construcao", label: "Construção", emoji: "🧱" },
  { value: "limpeza", label: "Limpeza", emoji: "🧽" },
  { value: "logistica", label: "Logística / entregas", emoji: "🚚" },
  { value: "administrativo", label: "Administrativo", emoji: "🗂️" },
  { value: "saude", label: "Saúde", emoji: "🩺" },
  { value: "educacao", label: "Educação", emoji: "📚" },
  { value: "tecnologia", label: "Tecnologia", emoji: "💻" },
  { value: "outros", label: "Outros", emoji: "✨" },
] as const;

export const JOB_BENEFITS = [
  "Vale transporte",
  "Vale refeição",
  "Cesta básica",
  "Plano de saúde",
  "Comissão",
  "Alimentação no local",
  "Plano odontológico",
  "Auxílio creche",
  "Uniforme",
];

export type JobExperienceLevel = "sem_experiencia" | "junior" | "pleno" | "senior";

export const JOB_EXPERIENCE_LABELS: Record<JobExperienceLevel, string> = {
  sem_experiencia: "Sem experiência",
  junior: "Júnior / iniciante",
  pleno: "Pleno",
  senior: "Sênior / especialista",
};

export type JobEducationLevel =
  | "indiferente"
  | "fundamental"
  | "medio"
  | "tecnico"
  | "superior";

export const JOB_EDUCATION_LABELS: Record<JobEducationLevel, string> = {
  indiferente: "Indiferente",
  fundamental: "Ensino fundamental",
  medio: "Ensino médio",
  tecnico: "Curso técnico",
  superior: "Ensino superior",
};

export const JOB_COMPANY_SIZES = [
  { value: "autonomo", label: "Autônomo / MEI" },
  { value: "pequena", label: "Pequena (até 20)" },
  { value: "media", label: "Média (21 a 100)" },
  { value: "grande", label: "Grande (100+)" },
] as const;

export const JOB_SCHEDULES = [
  "Comercial (seg a sex)",
  "6x1",
  "5x2",
  "12x36",
  "Escala de fim de semana",
  "Turno da noite",
  "Horário flexível",
];

export type ScreeningQuestion = { id: string; question: string };
export type ScreeningAnswer = { id: string; question: string; answer: string };


export function jobAreaLabel(value: string | null | undefined) {
  return JOB_AREAS.find((a) => a.value === value)?.label ?? "Outros";
}

export function jobAreaEmoji(value: string | null | undefined) {
  return JOB_AREAS.find((a) => a.value === value)?.emoji ?? "✨";
}

export type Job = {
  id: string;
  owner_id: string;
  community_id: string | null;
  title: string;
  description: string;
  area: string;
  company_name: string | null;
  company_logo_url: string | null;
  company_size: string | null;
  company_site: string | null;
  company_about: string | null;
  contract_type: JobContractType;
  work_mode: JobWorkMode;
  experience_level: JobExperienceLevel;
  education_level: JobEducationLevel;
  openings: number;
  is_pcd: boolean;
  weekly_hours: number | null;
  schedule: string | null;
  shift_start: string | null;
  shift_end: string | null;
  starts_on: string | null;
  salary_cents: number | null;
  salary_min_cents: number | null;
  salary_max_cents: number | null;
  salary_period: string;
  is_salary_negotiable: boolean;
  has_commission: boolean;
  requirements: string[];
  benefits: string[];
  address_hint: string | null;
  contact_whatsapp: string | null;
  contact_phone: string | null;
  expires_on: string | null;
  requires_cv: boolean;
  requires_cover_letter: boolean;
  screening_questions: ScreeningQuestion[];
  closed_reason: string | null;
  status: JobStatus;
  applications_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  community?: { name: string; slug: string } | null;
};

export type JobApplication = {
  id: string;
  job_id: string;
  applicant_id: string;
  message: string | null;
  cover_letter: string | null;
  cv_path: string | null;
  answers: ScreeningAnswer[];
  owner_notes: string | null;
  seen_at: string | null;
  status: JobApplicationStatus;
  created_at: string;
  updated_at: string;
};

export type JobApplicationWithProfile = JobApplication & {
  profile: PublicProfile | null;
};

export type JobConversation = {
  id: string;
  job_id: string;
  application_id: string | null;
  owner_id: string;
  applicant_id: string;
  last_message_at: string;
  created_at: string;
};

export type JobMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function periodSuffix(period: string) {
  if (period === "hour") return "/hora";
  if (period === "day") return "/dia";
  return "/mês";
}

export function formatSalary(
  job: Pick<Job, "salary_cents" | "salary_period"> &
    Partial<Pick<Job, "salary_min_cents" | "salary_max_cents">>,
) {
  const suffix = periodSuffix(job.salary_period);
  const min = job.salary_min_cents ?? null;
  const max = job.salary_max_cents ?? null;
  if (min != null && max != null) return `${brl(min)} a ${brl(max)}${suffix}`;
  if (min != null) return `A partir de ${brl(min)}${suffix}`;
  if (job.salary_cents != null) return `${brl(job.salary_cents)}${suffix}`;
  return "A combinar";
}

/** Menor valor conhecido do salário, em centavos — usado nos filtros do feed. */
export function jobSalaryFloor(job: Job): number | null {
  return job.salary_min_cents ?? job.salary_cents ?? null;
}

export function isJobExpired(job: Pick<Job, "expires_on">) {
  if (!job.expires_on) return false;
  const today = new Date().toISOString().slice(0, 10);
  return job.expires_on < today;
}

export function formatJobDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function formatShift(job: Pick<Job, "shift_start" | "shift_end">) {
  if (!job.shift_start && !job.shift_end) return null;
  const trim = (t: string | null) => (t ? t.slice(0, 5) : "—");
  return `${trim(job.shift_start)} às ${trim(job.shift_end)}`;
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
export const jobsByScopeQuery = (scope: Scope) =>
  queryOptions({
    queryKey: ["jobs", scope.kind, scope.slug],
    queryFn: async (): Promise<Job[]> => {
      const ids = await communityIdsForScope(scope);
      if (ids.length === 0) return [];
      const { data, error } = await db
        .from("jobs")
        .select("*, community:communities(name, slug)")
        .in("community_id", ids)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Job[];
    },
  });

export const jobQuery = (id: string) =>
  queryOptions({
    queryKey: ["job", id],
    queryFn: async (): Promise<Job | null> => {
      const { data, error } = await db
        .from("jobs")
        .select("*, community:communities(name, slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Job | null;
    },
  });

export const myJobsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-jobs", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<Job[]> => {
      const { data, error } = await db
        .from("jobs")
        .select("*, community:communities(name, slug)")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Job[];
    },
  });

export const myJobApplicationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-job-applications", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("job_applications")
        .select("*, job:jobs(id, title, status, company_name, salary_cents, salary_period)")
        .eq("applicant_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (JobApplication & { job: Job | null })[];
    },
  });

export const myApplicationForJobQuery = (jobId: string, userId: string | undefined) =>
  queryOptions({
    queryKey: ["job-application", jobId, userId ?? "anon"],
    enabled: !!userId && !!jobId,
    queryFn: async (): Promise<JobApplication | null> => {
      const { data, error } = await db
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .eq("applicant_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as JobApplication | null;
    },
  });

export const jobApplicationsQuery = (jobId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ["job-applications", jobId],
    enabled,
    queryFn: async (): Promise<JobApplicationWithProfile[]> => {
      const { data, error } = await db
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const apps = (data ?? []) as JobApplication[];
      if (apps.length === 0) return [];
      const profiles = await fetchProfiles(apps.map((a) => a.applicant_id));
      return apps.map((a) => ({ ...a, profile: profiles[a.applicant_id] ?? null }));
    },
  });

export const jobConversationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["job-conversations", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("job_conversations")
        .select("*, job:jobs(id, title, company_name, salary_cents, salary_period, status)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const convos = ((data ?? []) as (JobConversation & { job: Job | null })[]).filter(
        (c) => c.owner_id !== c.applicant_id,
      );
      const profiles = await fetchProfiles(
        convos.map((c) => (c.owner_id === userId ? c.applicant_id : c.owner_id)),
      );
      return convos.map((c) => ({
        ...c,
        other: profiles[c.owner_id === userId ? c.applicant_id : c.owner_id] ?? null,
      }));
    },
  });

export const jobConversationQuery = (id: string) =>
  queryOptions({
    queryKey: ["job-conversation", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("job_conversations")
        .select("*, job:jobs(id, title, company_name, salary_cents, salary_period, status)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as (JobConversation & { job: Job | null }) | null;
    },
  });

export const jobMessagesQuery = (conversationId: string) =>
  queryOptions({
    queryKey: ["job-messages", conversationId],
    queryFn: async (): Promise<JobMessage[]> => {
      const { data, error } = await db
        .from("job_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as JobMessage[];
    },
  });

// --- Mutations ---
export async function createJob(
  ownerId: string,
  payload: Partial<Job> & { title: string; description: string },
): Promise<Job> {
  const { data, error } = await db
    .from("jobs")
    .insert({ ...payload, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  return data as Job;
}

export async function updateJob(id: string, payload: Partial<Job>) {
  const { error } = await db.from("jobs").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteJob(id: string) {
  const { error } = await db.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

export async function trackJobView(id: string) {
  await db.rpc("increment_job_view", { _job_id: id });
}

export async function applyToJob(params: {
  jobId: string;
  applicantId: string;
  message: string;
  coverLetter?: string | null;
  cvPath?: string | null;
  answers?: ScreeningAnswer[];
}) {
  const { data: jobRow } = await db
    .from("jobs")
    .select("owner_id")
    .eq("id", params.jobId)
    .maybeSingle();
  if (jobRow?.owner_id === params.applicantId) {
    throw new Error("Você não pode se candidatar à sua própria vaga");
  }
  const { error } = await db.from("job_applications").insert({
    job_id: params.jobId,
    applicant_id: params.applicantId,
    message: params.message || null,
    cover_letter: params.coverLetter || null,
    cv_path: params.cvPath || null,
    answers: params.answers ?? [],
  });
  if (error) throw error;
}

export async function withdrawJobApplication(id: string) {
  const { error } = await db.from("job_applications").update({ status: "withdrawn" }).eq("id", id);
  if (error) throw error;
}

export async function setJobApplicationStatus(id: string, status: JobApplicationStatus) {
  const { error } = await db.from("job_applications").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function markJobApplicationSeen(id: string) {
  await db
    .from("job_applications")
    .update({ seen_at: new Date().toISOString(), status: "seen" })
    .eq("id", id)
    .eq("status", "sent");
}

export async function saveJobApplicationNotes(id: string, notes: string) {
  const { error } = await db
    .from("job_applications")
    .update({ owner_notes: notes || null })
    .eq("id", id);
  if (error) throw error;
}

export async function closeJob(id: string, reason: "preenchida" | "cancelada") {
  const { error } = await db
    .from("jobs")
    .update({ status: "closed", closed_reason: reason })
    .eq("id", id);
  if (error) throw error;
}


export const JOB_CHAT_ENABLED_STATUSES: JobApplicationStatus[] = ["shortlisted", "accepted"];

export function canJobApplicantChat(status?: JobApplicationStatus | null) {
  return !!status && JOB_CHAT_ENABLED_STATUSES.includes(status);
}

export async function startJobConversation(params: {
  jobId: string;
  ownerId: string;
  applicantId: string;
  applicationId?: string | null;
  /** Quando quem abre é o candidato, exigimos pré-seleção/aceite */
  asApplicantStatus?: JobApplicationStatus | null;
}): Promise<string> {
  if (params.ownerId === params.applicantId) {
    throw new Error("Você não pode conversar com você mesmo");
  }
  if (params.asApplicantStatus !== undefined && !canJobApplicantChat(params.asApplicantStatus)) {
    throw new Error(
      "Você poderá conversar com o anunciante assim que for pré-selecionado ou escolhido",
    );
  }
  const { data: existing } = await db
    .from("job_conversations")
    .select("id")
    .eq("job_id", params.jobId)
    .eq("applicant_id", params.applicantId)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await db
    .from("job_conversations")
    .insert({
      job_id: params.jobId,
      owner_id: params.ownerId,
      applicant_id: params.applicantId,
      application_id: params.applicationId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function sendJobMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await db
    .from("job_messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw error;
}

export async function markJobMessagesRead(conversationId: string, userId: string) {
  await db
    .from("job_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}
