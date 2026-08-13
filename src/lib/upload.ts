import { supabase } from "@/integrations/supabase/client";

const BUCKET = "profiles-media";

export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";
export const ACCEPTED_MEDIA_TYPES = "image/jpeg,image/png,image/webp,video/*";

const UNSUPPORTED_MESSAGE =
  "Esse formato de foto não é aceito (fotos do iPhone em HEIC não abrem em outros aparelhos). Escolha uma foto em JPG ou PNG.";

async function decodeImage(file: File): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img> decoding
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new Error(UNSUPPORTED_MESSAGE);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Re-encodes any browser-decodable image to JPEG, resized to `maxSize` on its
 * longest side. Formats the browser cannot decode (HEIC/HEIF on Android and
 * desktop) throw a friendly error instead of being uploaded broken.
 */
export async function normalizeImage(file: File, maxSize = 1600): Promise<File> {
  const source = await decodeImage(file);
  const sw = "width" in source ? source.width : 0;
  const sh = "height" in source ? source.height : 0;
  if (!sw || !sh) throw new Error(UNSUPPORTED_MESSAGE);

  const scale = Math.min(1, maxSize / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(UNSUPPORTED_MESSAGE);
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  if ("close" in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob || blob.size === 0) throw new Error(UNSUPPORTED_MESSAGE);

  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

export async function uploadMedia(file: File, userId: string, prefix = "misc"): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const safeFile = isVideo ? file : await normalizeImage(file, prefix === "avatar" ? 512 : 1600);

  const ext = isVideo ? safeFile.name.split(".").pop()?.toLowerCase() || "mp4" : "jpg";
  const contentType = isVideo ? safeFile.type : "image/jpeg";
  const path = `${userId}/${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, safeFile, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function detectMediaType(file: File): "image" | "video" {
  return file.type.startsWith("video/") ? "video" : "image";
}
