import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileText, Plus, Trash2, Upload } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  AVAILABILITY_OPTIONS,
  MAX_CV_BYTES,
  myCandidateProfileQuery,
  ownResumeUrl,
  removeResume,
  SHIFT_OPTIONS,
  uploadResume,
  upsertCandidateProfile,
  type CandidateEducation,
  type CandidateExperience,
} from "@/lib/candidate-api";

export const Route = createFileRoute("/conta/candidato")({
  head: () => ({
    meta: [
      { title: "Meu currículo — teiyaa" },
      {
        name: "description",
        content:
          "Monte seu perfil de candidato: experiência, formação, disponibilidade e currículo em PDF para se candidatar às vagas do bairro.",
      },
      { property: "og:title", content: "Meu currículo — teiyaa" },
      {
        property: "og:description",
        content: "Perfil de candidato e currículo em PDF no teiyaa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeuCurriculoPage,
});

function MeuCurriculoPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery(myCandidateProfileQuery(user?.id));

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("imediata");
  const [shifts, setShifts] = useState<string[]>([]);
  const [hasCnh, setHasCnh] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [skillsText, setSkillsText] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [experiences, setExperiences] = useState<CandidateExperience[]>([]);
  const [education, setEducation] = useState<CandidateEducation[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setHeadline(profile.headline ?? "");
    setBio(profile.bio ?? "");
    setAvailability(profile.availability);
    setShifts(profile.shifts ?? []);
    setHasCnh(profile.has_cnh);
    setHasVehicle(profile.has_vehicle);
    setSkillsText((profile.skills ?? []).join(", "));
    setWhatsapp(profile.whatsapp ?? "");
    setPhone(profile.phone ?? "");
    setExperiences(profile.experiences ?? []);
    setEducation(profile.education ?? []);
  }, [profile]);

  const toggleShift = (s: string) =>
    setShifts((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertCandidateProfile(user.id, {
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        availability,
        shifts,
        has_cnh: hasCnh,
        has_vehicle: hasVehicle,
        skills: skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
        whatsapp: whatsapp.trim() || null,
        phone: phone.trim() || null,
        experiences: experiences.filter((e) => e.role.trim() || e.company.trim()),
        education: education.filter((e) => e.course.trim() || e.school.trim()),
      });
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
      toast.success("Currículo atualizado");
    } catch (err) {
      toast.error("Não consegui salvar: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCv = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const { path, name } = await uploadResume(file, user.id);
      await upsertCandidateProfile(user.id, {
        cv_path: path,
        cv_name: name,
        cv_updated_at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
      toast.success("Currículo enviado");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const dropCv = async () => {
    if (!user || !profile?.cv_path) return;
    if (!confirm("Remover seu currículo em PDF?")) return;
    await removeResume(user.id, profile.cv_path);
    qc.invalidateQueries({ queryKey: ["candidate-profile"] });
    toast.success("Currículo removido");
  };

  const openCv = async () => {
    if (!profile?.cv_path) return;
    try {
      const url = await ownResumeUrl(profile.cv_path);
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Não consegui abrir o currículo");
    }
  };

  if (loading || isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Carregando…
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        <Link to="/conta" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Minha conta
        </Link>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Meu currículo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha uma vez e use em todas as vagas do bairro. Só quem anuncia a vaga em que você se
          candidatar consegue ver esses dados.
        </p>

        {/* Currículo em PDF */}
        <section className="mt-6 p-4 rounded-2xl border border-border bg-card">
          <h2 className="font-bold inline-flex items-center gap-2">
            <FileText className="size-4 text-cat-vaga" /> Currículo em PDF
          </h2>
          {profile?.cv_path ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCv}
                className="px-4 py-2 rounded-full bg-brand text-primary-foreground text-sm font-bold"
              >
                Abrir {profile.cv_name ?? "currículo.pdf"}
              </button>
              <button
                type="button"
                onClick={dropCv}
                className="px-4 py-2 rounded-full border border-border text-sm font-semibold text-destructive inline-flex items-center gap-1.5"
              >
                <Trash2 className="size-4" /> Remover
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Ainda sem currículo. Algumas vagas pedem o PDF.
            </p>
          )}
          <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold cursor-pointer">
            <Upload className="size-4" />
            {uploading ? "Enviando…" : profile?.cv_path ? "Enviar outro PDF" : "Enviar PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) handleCv(f);
              }}
            />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            Apenas PDF, até {Math.round(MAX_CV_BYTES / 1024 / 1024)} MB.
          </p>
        </section>

        <div className="mt-6 space-y-4">
          <Field label="Título profissional">
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={80}
              placeholder="Ex.: Atendente com 3 anos de experiência"
              className="input"
            />
          </Field>
          <Field label="Sobre você">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={800}
              placeholder="Conte o que você já fez, o que sabe fazer bem e o que procura."
              className="input"
            />
          </Field>
          <Field label="Disponibilidade">
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="input"
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Turnos que você pode trabalhar">
            <div className="flex flex-wrap gap-2">
              {SHIFT_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleShift(s)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${
                    shifts.includes(s)
                      ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                      : "bg-card border-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={hasCnh} onChange={(e) => setHasCnh(e.target.checked)} />
              Tenho CNH
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={hasVehicle}
                onChange={(e) => setHasVehicle(e.target.checked)}
              />
              Tenho veículo próprio
            </label>
          </div>
          <Field label="Habilidades (separadas por vírgula)">
            <input
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              maxLength={300}
              placeholder="Atendimento, caixa, Excel, pintura"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="WhatsApp">
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                maxLength={20}
                placeholder="11999999999"
                className="input"
              />
            </Field>
            <Field label="Telefone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                placeholder="1133334444"
                className="input"
              />
            </Field>
          </div>
        </div>

        {/* Experiências */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Experiências</h2>
            <button
              type="button"
              onClick={() =>
                setExperiences((p) => [...p, { role: "", company: "", period: "", description: "" }])
              }
              className="text-sm font-bold text-cat-vaga inline-flex items-center gap-1"
            >
              <Plus className="size-4" /> Adicionar
            </button>
          </div>
          {experiences.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Sem experiência formal? Tudo bem — muitas vagas do bairro aceitam iniciantes.
            </p>
          )}
          <div className="mt-3 space-y-3">
            {experiences.map((exp, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <input
                  value={exp.role}
                  onChange={(e) =>
                    setExperiences((p) =>
                      p.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)),
                    )
                  }
                  maxLength={60}
                  placeholder="Cargo (ex.: Auxiliar de cozinha)"
                  className="input"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={exp.company}
                    onChange={(e) =>
                      setExperiences((p) =>
                        p.map((x, idx) => (idx === i ? { ...x, company: e.target.value } : x)),
                      )
                    }
                    maxLength={60}
                    placeholder="Empresa"
                    className="input"
                  />
                  <input
                    value={exp.period}
                    onChange={(e) =>
                      setExperiences((p) =>
                        p.map((x, idx) => (idx === i ? { ...x, period: e.target.value } : x)),
                      )
                    }
                    maxLength={40}
                    placeholder="Período (ex.: 2022 a 2024)"
                    className="input"
                  />
                </div>
                <textarea
                  value={exp.description}
                  onChange={(e) =>
                    setExperiences((p) =>
                      p.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)),
                    )
                  }
                  rows={2}
                  maxLength={400}
                  placeholder="O que você fazia"
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => setExperiences((p) => p.filter((_, idx) => idx !== i))}
                  className="text-xs font-semibold text-destructive inline-flex items-center gap-1"
                >
                  <Trash2 className="size-3.5" /> Remover
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Formação */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Formação</h2>
            <button
              type="button"
              onClick={() => setEducation((p) => [...p, { course: "", school: "", year: "" }])}
              className="text-sm font-bold text-cat-vaga inline-flex items-center gap-1"
            >
              <Plus className="size-4" /> Adicionar
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {education.map((ed, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <input
                  value={ed.course}
                  onChange={(e) =>
                    setEducation((p) =>
                      p.map((x, idx) => (idx === i ? { ...x, course: e.target.value } : x)),
                    )
                  }
                  maxLength={80}
                  placeholder="Curso / nível (ex.: Ensino médio completo)"
                  className="input"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={ed.school}
                    onChange={(e) =>
                      setEducation((p) =>
                        p.map((x, idx) => (idx === i ? { ...x, school: e.target.value } : x)),
                      )
                    }
                    maxLength={80}
                    placeholder="Escola / instituição"
                    className="input"
                  />
                  <input
                    value={ed.year}
                    onChange={(e) =>
                      setEducation((p) =>
                        p.map((x, idx) => (idx === i ? { ...x, year: e.target.value } : x)),
                      )
                    }
                    maxLength={20}
                    placeholder="Ano de conclusão"
                    className="input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEducation((p) => p.filter((_, idx) => idx !== i))}
                  className="text-xs font-semibold text-destructive inline-flex items-center gap-1"
                >
                  <Trash2 className="size-3.5" /> Remover
                </button>
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-8 w-full px-6 py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar currículo"}
        </button>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}
