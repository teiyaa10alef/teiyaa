import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  applicationId: z.string().uuid(),
});

/**
 * Devolve um link temporário para o currículo de uma candidatura.
 * Só o próprio candidato ou o dono da vaga conseguem abrir.
 */
export const getResumeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: app, error } = await supabase
      .from("job_applications")
      .select("cv_path, applicant_id, job_id")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (error) throw new Error("Não consegui abrir o currículo.");
    if (!app?.cv_path) throw new Error("Essa candidatura não tem currículo anexado.");

    if (app.applicant_id !== userId) {
      const { data: job } = await supabase
        .from("jobs")
        .select("owner_id")
        .eq("id", app.job_id)
        .maybeSingle();
      if (!job || job.owner_id !== userId) throw new Error("Sem permissão.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("resumes")
      .createSignedUrl(app.cv_path, 300);
    if (signErr || !signed) throw new Error("Não consegui gerar o link do currículo.");
    return { url: signed.signedUrl };
  });
