import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
const CV_BUCKET = "resumes";

export type CandidateExperience = {
  role: string;
  company: string;
  period: string;
  description: string;
};

export type CandidateEducation = {
  course: string;
  school: string;
  year: string;
};

export type CandidateProfile = {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  availability: string;
  shifts: string[];
  has_cnh: boolean;
  has_vehicle: boolean;
  skills: string[];
  experiences: CandidateExperience[];
  education: CandidateEducation[];
  whatsapp: string | null;
  phone: string | null;
  cv_path: string | null;
  cv_name: string | null;
  cv_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export const AVAILABILITY_OPTIONS = [
  { value: "imediata", label: "Disponibilidade imediata" },
  { value: "15_dias", label: "Em até 15 dias" },
  { value: "30_dias", label: "Em até 30 dias" },
  { value: "combinar", label: "A combinar" },
] as const;

export const SHIFT_OPTIONS = ["Manhã", "Tarde", "Noite", "Madrugada", "Fins de semana"];

export function availabilityLabel(value: string | null | undefined) {
  return AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? "A combinar";
}

export const MAX_CV_BYTES = 5 * 1024 * 1024;

export const myCandidateProfileQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["candidate-profile", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<CandidateProfile | null> => {
      const { data, error } = await db
        .from("candidate_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as CandidateProfile | null;
    },
  });

/** Perfis de candidatos visíveis para o dono da vaga (RLS cuida da permissão). */
export const candidateProfilesQuery = (userIds: string[], enabled: boolean) =>
  queryOptions({
    queryKey: ["candidate-profiles", [...userIds].sort().join(",")],
    enabled: enabled && userIds.length > 0,
    queryFn: async (): Promise<Record<string, CandidateProfile>> => {
      const { data, error } = await db
        .from("candidate_profiles")
        .select("*")
        .in("user_id", userIds);
      if (error) throw error;
      const map: Record<string, CandidateProfile> = {};
      for (const row of (data ?? []) as CandidateProfile[]) map[row.user_id] = row;
      return map;
    },
  });

export async function upsertCandidateProfile(
  userId: string,
  payload: Partial<CandidateProfile>,
): Promise<CandidateProfile> {
  const { data, error } = await db
    .from("candidate_profiles")
    .upsert({ ...payload, user_id: userId }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as CandidateProfile;
}

export async function uploadResume(file: File, userId: string) {
  if (file.type !== "application/pdf") {
    throw new Error("O currículo precisa estar em PDF.");
  }
  if (file.size > MAX_CV_BYTES) {
    throw new Error("O arquivo é muito grande. O limite é 5 MB.");
  }
  const path = `${userId}/curriculo-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from(CV_BUCKET).upload(path, file, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw error;
  return { path, name: file.name.slice(0, 120) };
}

export async function removeResume(userId: string, path: string) {
  await supabase.storage.from(CV_BUCKET).remove([path]);
  await db
    .from("candidate_profiles")
    .update({ cv_path: null, cv_name: null, cv_updated_at: null })
    .eq("user_id", userId);
}

/** Link temporário do próprio currículo (o dono da vaga usa a server function). */
export async function ownResumeUrl(path: string) {
  const { data, error } = await supabase.storage.from(CV_BUCKET).createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
