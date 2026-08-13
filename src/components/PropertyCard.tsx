import { Link } from "@tanstack/react-router";
import { BedDouble, Bath, Car, Ruler, MapPin, Home } from "lucide-react";
import {
  formatPrice,
  formatMoney,
  KIND_LABELS,
  PURPOSE_LABELS,
  type Property,
} from "@/lib/properties-api";

export function PropertyCard({ property }: { property: Property }) {
  const condo = formatMoney(property.condo_cents);
  return (
    <Link
      to="/imoveis/$propertyId"
      params={{ propertyId: property.id }}
      className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col hover:border-cat-imovel/50 transition-colors"
    >
      <div className="aspect-[16/10] bg-muted relative">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Home className="size-8" />
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold bg-cat-imovel text-primary-foreground">
          {PURPOSE_LABELS[property.purpose]}
        </span>
        {property.status === "reserved" && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold bg-card border border-border">
            Reservado
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <p className="text-lg font-bold text-cat-imovel leading-tight">{formatPrice(property)}</p>
        {condo && <p className="text-xs text-muted-foreground">Condomínio {condo}</p>}
        <h3 className="font-bold leading-tight line-clamp-2">{property.title}</h3>

        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-1">
          <span className="px-2 py-0.5 rounded-full bg-cat-imovel-soft text-cat-imovel border border-cat-imovel/25 font-semibold">
            {KIND_LABELS[property.kind]}
          </span>
          {property.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-3.5" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <Bath className="size-3.5" /> {property.bathrooms}
            </span>
          )}
          {property.parking_spots > 0 && (
            <span className="inline-flex items-center gap-1">
              <Car className="size-3.5" /> {property.parking_spots}
            </span>
          )}
          {property.area_m2 && (
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-3.5" /> {property.area_m2} m²
            </span>
          )}
        </div>

        {(property.community?.name || property.address_hint) && (
          <p className="mt-auto pt-2 text-xs text-muted-foreground inline-flex items-center gap-1 truncate">
            <MapPin className="size-3.5 shrink-0" />
            {property.address_hint || property.community?.name}
          </p>
        )}
      </div>
    </Link>
  );
}
