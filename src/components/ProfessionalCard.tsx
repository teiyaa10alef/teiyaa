import { Link } from "@tanstack/react-router";
import { MessageCircle, MapPin, Images } from "lucide-react";
import { RatingStars } from "./RatingStars";
import {
  formatPrice,
  professionLabel,
  trackProfessionalWhatsapp,
  type ProfessionalCardData,
} from "@/lib/professional-api";

export function ProfessionalCard({ pro }: { pro: ProfessionalCardData }) {
  const wa = pro.whatsapp?.replace(/\D/g, "");
  const price = formatPrice(pro.price_from_cents);

  return (
    <article className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
      <Link
        to="/profissionais/perfil/$userId"
        params={{ userId: pro.user_id }}
        className="flex gap-3 p-4"
      >
        <div className="size-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border">
          {pro.avatar_url ? (
            <img src={pro.avatar_url} alt={pro.profession} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
              {(pro.display_name ?? pro.profession).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-tight truncate">{pro.display_name ?? professionLabel(pro.category)}</h3>
          <p className="text-sm text-cat-profissional font-semibold truncate">
            {professionLabel(pro.category) !== "Profissional" ? professionLabel(pro.category) : pro.profession}
          </p>
          {pro.headline && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{pro.headline}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {pro.rating_count > 0 ? (
              <span className="inline-flex items-center gap-1">
                <RatingStars value={pro.rating_avg ?? 0} size={12} />
                <span className="font-semibold text-foreground">{(pro.rating_avg ?? 0).toFixed(1)}</span>
                <span>({pro.rating_count})</span>
              </span>
            ) : (
              <span>Sem avaliações ainda</span>
            )}
            {pro.years_experience != null && pro.years_experience > 0 && (
              <span>· {pro.years_experience} anos de experiência</span>
            )}
          </div>
        </div>
      </Link>

      {pro.portfolio_preview.length > 0 && (
        <Link
          to="/profissionais/perfil/$userId"
          params={{ userId: pro.user_id }}
          className="px-4 grid grid-cols-3 gap-1.5"
        >
          {pro.portfolio_preview.map((item) => (
            <div key={item.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              {item.media_type === "video" ? (
                <video src={item.media_url} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={item.media_url} alt={item.title ?? ""} loading="lazy" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </Link>
      )}

      <div className="p-4 pt-3 mt-auto flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground min-w-0">
          {price ? (
            <span className="font-semibold text-foreground">a partir de {price}</span>
          ) : pro.service_area_km ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> atende até {pro.service_area_km} km
            </span>
          ) : pro.portfolio_count > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Images className="size-3" /> {pro.portfolio_count} fotos do trabalho
            </span>
          ) : null}
        </div>
        {wa && (
          <a
            href={`https://wa.me/55${wa}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => void trackProfessionalWhatsapp(pro.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-brand text-primary-foreground text-sm font-bold flex-shrink-0"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
