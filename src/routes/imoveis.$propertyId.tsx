import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BedDouble,
  Bath,
  Car,
  Ruler,
  MapPin,
  Home,
  Heart,
  MessageCircle,
  PawPrint,
  Sofa,
  ArrowLeft,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  propertyQuery,
  favoritePropertyIdsQuery,
  togglePropertyFavorite,
  trackPropertyView,
  trackPropertyWhatsapp,
  formatPrice,
  formatMoney,
  KIND_LABELS,
  PURPOSE_LABELS,
  PROPERTY_STATUS_LABELS,
  whatsappLink,
} from "@/lib/properties-api";

export const Route = createFileRoute("/imoveis/$propertyId")({
  head: () => ({
    meta: [
      { title: "Imóvel no bairro — teiyaa" },
      {
        name: "description",
        content: "Veja fotos, valores e detalhes deste imóvel para alugar ou comprar no bairro.",
      },
      { property: "og:title", content: "Imóvel no bairro — teiyaa" },
      {
        property: "og:description",
        content: "Imóveis para alugar e comprar na sua comunidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { propertyId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: property, isLoading } = useQuery(propertyQuery(propertyId));
  const { data: favorites = [] } = useQuery(favoritePropertyIdsQuery(user?.id));
  const [active, setActive] = useState(0);

  useEffect(() => {
    void trackPropertyView(propertyId);
  }, [propertyId]);

  const isFavorite = favorites.includes(propertyId);

  const handleFavorite = async () => {
    if (!user) {
      toast.info("Entre na sua conta para salvar imóveis");
      return;
    }
    try {
      await togglePropertyFavorite(user.id, propertyId, isFavorite);
      await queryClient.invalidateQueries({ queryKey: ["property-favorites"] });
    } catch {
      toast.error("Não consegui salvar agora");
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <p className="text-muted-foreground py-20 text-center">Carregando…</p>
      </Shell>
    );
  }

  if (!property) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <h1 className="text-xl font-bold">Imóvel não encontrado</h1>
          <Link to="/imoveis" className="mt-4 inline-block text-brand font-bold">
            Ver outros imóveis
          </Link>
        </div>
      </Shell>
    );
  }

  const wa = whatsappLink(
    property.whatsapp,
    `Olá! Vi o imóvel "${property.title}" no teiyaa e queria saber mais.`,
  );
  const condo = formatMoney(property.condo_cents);
  const iptu = formatMoney(property.iptu_cents);

  return (
    <Shell>
      <Link
        to="/imoveis"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="size-4" /> Imóveis
      </Link>

      <div className="rounded-2xl overflow-hidden border border-border bg-muted aspect-[16/10]">
        {property.images?.[active] ? (
          <img
            src={property.images[active]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Home className="size-10" />
          </div>
        )}
      </div>
      {property.images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {property.images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              className={`size-16 shrink-0 rounded-xl overflow-hidden border-2 ${
                i === active ? "border-cat-imovel" : "border-border"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2 py-0.5 rounded-full bg-cat-imovel text-primary-foreground font-bold">
              {PURPOSE_LABELS[property.purpose]}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cat-imovel-soft text-cat-imovel border border-cat-imovel/25 font-semibold">
              {KIND_LABELS[property.kind]}
            </span>
            {property.status !== "active" && (
              <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
                {PROPERTY_STATUS_LABELS[property.status]}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-xl md:text-2xl font-bold leading-tight">{property.title}</h1>
          <p className="mt-1 text-2xl font-bold text-cat-imovel">{formatPrice(property)}</p>
          <p className="text-xs text-muted-foreground">
            {[condo && `Condomínio ${condo}`, iptu && `IPTU ${iptu}`]
              .filter(Boolean)
              .join(" · ") || "Sem taxas informadas"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          aria-label="Salvar imóvel"
          className={`size-11 shrink-0 rounded-full border flex items-center justify-center ${
            isFavorite ? "bg-cat-imovel-soft border-cat-imovel text-cat-imovel" : "border-border"
          }`}
        >
          <Heart className={`size-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      <ul className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Fact icon={BedDouble} label="Quartos" value={property.bedrooms} />
        <Fact icon={Bath} label="Banheiros" value={property.bathrooms} />
        <Fact icon={Car} label="Vagas" value={property.parking_spots} />
        <Fact icon={Ruler} label="Área" value={property.area_m2 ? `${property.area_m2} m²` : "—"} />
      </ul>

      <div className="mt-3 flex gap-2 flex-wrap text-xs">
        {property.is_furnished && (
          <span className="px-3 py-1 rounded-full border border-border inline-flex items-center gap-1.5">
            <Sofa className="size-3.5" /> Mobiliado
          </span>
        )}
        {property.accepts_pets && (
          <span className="px-3 py-1 rounded-full border border-border inline-flex items-center gap-1.5">
            <PawPrint className="size-3.5" /> Aceita pet
          </span>
        )}
      </div>

      {property.description && (
        <section className="mt-6">
          <h2 className="font-bold mb-1.5">Sobre o imóvel</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {property.description}
          </p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-bold mb-1.5">Localização</h2>
        <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
          <MapPin className="size-4" />
          {property.address || property.address_hint || property.community?.name || "Não informado"}
        </p>
      </section>

      <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-border flex gap-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void trackPropertyWhatsapp(propertyId)}
            className="flex-1 py-3 rounded-full bg-brand text-primary-foreground font-bold text-center shadow-brand inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="size-4" /> Falar no WhatsApp
          </a>
        ) : (
          <p className="flex-1 py-3 text-center text-sm text-muted-foreground">
            {property.phone ? `Contato: ${property.phone}` : "Sem contato informado"}
          </p>
        )}
      </div>
    </Shell>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string | number;
}) {
  return (
    <li className="rounded-2xl border border-border bg-card px-3 py-2.5">
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <Icon className="size-3.5" /> {label}
      </span>
      <span className="block font-bold">{value}</span>
    </li>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-5">{children}</main>
      <SiteFooter />
    </div>
  );
}
