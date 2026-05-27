import { supabase } from "@/integrations/supabase/client";

const BUCKET = "profiles-media";

export async function uploadMedia(file: File, userId: string, prefix = "misc"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function detectMediaType(file: File): "image" | "video" {
  return file.type.startsWith("video/") ? "video" : "image";
}
