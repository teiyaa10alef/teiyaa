import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users, Flame } from "lucide-react";
import {
  formatBudget,
  formatGigDate,
  gigCategoryEmoji,
  gigCategoryLabel,
  timeAgo,
  type Gig,
} from "@/lib/gigs-api";

export function GigCard({ gig }: { gig: Gig }) {
  return (
    <Link
      to="/freelances/$gigId"
      params={{ gigId: gig.id }}
      className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col hover:border-cat-freelance/50 transition-colors"
    >
      {gig.images?.[0] && (
        <div className="aspect-[16/9] bg-muted">
          <img src={gig.images[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2 py-0.5 rounded-full bg-cat-freelance-soft text-cat-freelance border border-cat-freelance/25 font-semibold">
            {gigCategoryEmoji(gig.category)} {gigCategoryLabel(gig.category)}
          </span>
          {gig.is_urgent && (
            <span className="px-2 py-0.5 rounded-full bg-cat-freelance text-primary-foreground font-semibold inline-flex items-center gap-1">
              <Flame className="size-3" /> Urgente
            </span>
          )}
          {gig.status === "in_progress" && (
            <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
              Em andamento
            </span>
          )}
        </div>

        <h3 className="font-bold leading-tight line-clamp-2">{gig.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{gig.description}</p>

        <p className="text-lg font-bold text-cat-freelance">{formatBudget(gig)}</p>

        <div className="mt-auto pt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" /> {formatGigDate(gig)}
          </span>
          {gig.community?.name && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {gig.community.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> {gig.applications_count}{" "}
            {gig.applications_count === 1 ? "candidato" : "candidatos"}
          </span>
          <span className="ml-auto">{timeAgo(gig.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
