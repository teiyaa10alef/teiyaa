import type { Listing } from "@/lib/listings-api";
import { CATEGORY_LABELS } from "@/lib/community";

function formatPrice(cents: number | null) {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ListingCard({ listing }: { listing: Listing }) {
  const price = formatPrice(listing.price_cents);
  const cover = listing.images?.[0];

  return (
    <article className="bg-card rounded-3xl overflow-hidden border border-border hover:border-brand/40 transition-colors flex flex-col">
      {cover ? (
        <div className="w-full aspect-[4/3] overflow-hidden">
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-brand-soft flex items-center justify-center text-4xl">
          {listing.category === "comercio" && "🛍️"}
          {listing.category === "servico" && "🛠️"}
          {listing.category === "imovel" && "🏠"}
          {listing.category === "freelance" && "🤝"}
          {listing.category === "vaga" && "💼"}
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-brand">
            {CATEGORY_LABELS[listing.category]}
            {listing.subcategory ? ` • ${listing.subcategory}` : ""}
          </span>
          {listing.community?.name && (
            <span className="text-[10px] text-muted-foreground truncate">
              {listing.community.name}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold mb-2 leading-tight">{listing.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">
          {listing.description}
        </p>
        <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
          <span className="font-bold text-foreground">{price ?? "Sob consulta"}</span>
          {listing.contact_whatsapp && (
            <a
              href={`https://wa.me/55${listing.contact_whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-brand text-primary-foreground rounded-lg text-xs font-bold"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
