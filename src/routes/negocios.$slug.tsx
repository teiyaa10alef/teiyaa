import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getBusinessBySlug, listBusinessHours, listBusinessServices, listBusinessMedia, WEEKDAYS } from "@/lib/account-api";
import { MessageCircle, Phone, Instagram, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/negocios/$slug")({
  head: () => ({ meta: [{ title: "Negócio — teiyaa" }] }),
  component: PublicBusiness,
});

function PublicBusiness() {
  const { slug } = Route.useParams();
  const { data: biz, isLoading } = useQuery({
    queryKey: ["public-biz", slug],
    queryFn: () => getBusinessBySlug(slug),
  });
  const { data: hours = [] } = useQuery({
    queryKey: ["public-biz-hours", biz?.id],
    queryFn: () => listBusinessHours(biz!.id),
    enabled: !!biz,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["public-biz-svc", biz?.id],
    queryFn: () => listBusinessServices(biz!.id),
    enabled: !!biz,
  });
  const { data: media = [] } = useQuery({
    queryKey: ["public-biz-media", biz?.id],
    queryFn: () => listBusinessMedia(biz!.id),
    enabled: !!biz,
  });

  if (isLoading) return <Layout><p className="text-muted-foreground">Carregando…</p></Layout>;
  if (!biz) return <Layout><p>Negócio não encontrado.</p></Layout>;

  const waNumber = biz.whatsapp?.replace(/\D/g, "");
  const todayHour = hours.find((h) => h.weekday === new Date().getDay());
  const isOpen = todayHour && !todayHour.is_closed && todayHour.opens_at && todayHour.closes_at &&
    isTimeBetween(todayHour.opens_at, todayHour.closes_at);

  return (
    <Layout>
      <div className="relative h-48 md:h-72 rounded-2xl overflow-hidden bg-muted">
        {biz.cover_url && <img src={biz.cover_url} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="-mt-10 px-4 md:px-6 flex items-end gap-4">
        <div className="size-20 md:size-28 rounded-2xl border-4 border-background bg-surface overflow-hidden flex-shrink-0">
          {biz.logo_url && <img src={biz.logo_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="pb-2 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">{biz.name}</h1>
          <p className="text-sm text-muted-foreground">{biz.category ?? ""}</p>
          {todayHour && (
            <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${isOpen ? "text-green-600" : "text-muted-foreground"}`}>
              <Clock className="size-3" /> {isOpen ? "Aberto agora" : "Fechado agora"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {waNumber && <a href={`https://wa.me/55${waNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-primary-foreground rounded-full font-bold"><MessageCircle className="size-4" /> WhatsApp</a>}
        {biz.phone && <a href={`tel:${biz.phone}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold"><Phone className="size-4" /> Ligar</a>}
        {biz.instagram && <a href={`https://instagram.com/${biz.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold"><Instagram className="size-4" /> Instagram</a>}
      </div>

      {biz.description && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2">Sobre</h2>
          <p className="text-muted-foreground whitespace-pre-line">{biz.description}</p>
        </section>
      )}

      {biz.address && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><MapPin className="size-5" /> Endereço</h2>
          <p className="text-muted-foreground">{biz.address}</p>
        </section>
      )}

      {hours.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Horários</h2>
          <ul className="space-y-1">
            {WEEKDAYS.map((label, w) => {
              const h = hours.find((x) => x.weekday === w);
              return (
                <li key={w} className="flex justify-between text-sm border-b border-border py-2">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">
                    {!h || h.is_closed ? "Fechado" : `${h.opens_at?.slice(0, 5) ?? ""} – ${h.closes_at?.slice(0, 5) ?? ""}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {services.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Cardápio / Serviços</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.id} className="p-4 rounded-xl border border-border bg-surface flex justify-between gap-3">
                <span className="font-medium">{s.title}</span>
                {s.price_cents != null && <span className="text-sm text-muted-foreground whitespace-nowrap">R$ {(s.price_cents / 100).toFixed(2)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {media.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Galeria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {media.map((m) => (
              <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={m.media_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}

function isTimeBetween(open: string, close: string): boolean {
  const now = new Date();
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= oh * 60 + om && cur <= ch * 60 + cm;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
