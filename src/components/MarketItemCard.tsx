import { Link } from "@tanstack/react-router";
import { CONDITION_LABELS, MARKET_CATEGORY_LABELS, formatBRL, type MarketItem } from "@/lib/market-api";

export function MarketItemCard({ item }: { item: MarketItem }) {
  const cover = item.images?.[0];
  return (
    <Link
      to="/mercado/$itemId"
      params={{ itemId: item.id }}
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-brand/50 transition-colors flex flex-col"
    >
      <div className="w-full aspect-square overflow-hidden bg-brand-soft flex items-center justify-center">
        {cover ? (
          <img
            src={cover}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-4xl">📦</span>
        )}
      </div>
      <div className="p-3 md:p-4 flex flex-col gap-1 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand">
          {MARKET_CATEGORY_LABELS[item.category] ?? item.category} • {CONDITION_LABELS[item.condition]}
        </span>
        <h3 className="text-sm md:text-base font-bold leading-tight line-clamp-2">{item.title}</h3>
        <span className="mt-auto pt-2 font-bold text-base md:text-lg">
          {formatBRL(item.price_cents)}
        </span>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="truncate">{item.community?.name ?? "Bairro"}</span>
          {item.status === "reserved" && <span className="text-brand font-semibold">Reservado</span>}
        </div>
      </div>
    </Link>
  );
}
