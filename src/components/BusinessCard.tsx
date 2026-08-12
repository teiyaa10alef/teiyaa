import { Link } from "@tanstack/react-router";
import { Store, Star, Clock, Tag, Heart } from "lucide-react";
import { businessCategoryLabel, isOpenNow, type BusinessCardData } from "@/lib/business-api";

interface Props {
  business: BusinessCardData;
  favorited?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export function BusinessCard({ business: b, favorited, onToggleFavorite }: Props) {
  const open = isOpenNow(b.hours);

  return (
    <div className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all">
      <Link to="/negocios/$slug" params={{ slug: b.slug }} className="block">
        <div className="relative h-32 bg-muted">
          {b.cover_url ? (
            <img src={b.cover_url} alt={`Foto de ${b.name}`} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Store className="size-8" />
            </div>
          )}
          {b.promo_count > 0 && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cat-freelance text-primary-foreground text-[11px] font-bold">
              <Tag className="size-3" /> {b.promo_count} promo{b.promo_count > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="p-4 pt-3">
          <div className="flex items-start gap-3">
            <div className="size-11 -mt-8 rounded-xl border-2 border-card bg-surface overflow-hidden flex-shrink-0">
              {b.logo_url ? (
                <img src={b.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Store className="size-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold truncate">{b.name}</h3>
              <p className="text-xs text-muted-foreground">{businessCategoryLabel(b.category)}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {b.rating_count > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="size-3.5 fill-current text-cat-comercio" />
                {b.rating_avg?.toFixed(1)}
                <span className="text-muted-foreground font-normal">({b.rating_count})</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Sem avaliações</span>
            )}
            {open !== null && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold ${
                  open
                    ? "bg-cat-imovel-soft text-cat-imovel border-cat-imovel/25"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <Clock className="size-3" /> {open ? "Aberto" : "Fechado"}
              </span>
            )}
          </div>

          {b.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{b.description}</p>
          )}
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          aria-label={favorited ? "Remover dos salvos" : "Salvar comércio"}
          onClick={() => onToggleFavorite(b.id)}
          className="absolute top-2 right-2 size-8 rounded-full bg-background/90 border border-border flex items-center justify-center"
        >
          <Heart className={`size-4 ${favorited ? "fill-cat-mercado text-cat-mercado" : "text-muted-foreground"}`} />
        </button>
      )}
    </div>
  );
}
