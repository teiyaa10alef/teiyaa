import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, MapPin, Check, ShoppingBag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { communitiesQuery } from "@/lib/listings-api";
import { CATEGORY_ORDER, type CategoryKey } from "@/lib/community";
import {
  CATEGORY_ICONS,
  CATEGORY_SOFT,
  CATEGORY_SOLID,
  VISUAL_LABELS,
} from "@/lib/category-visuals";

interface ScopeBarProps {
  active: "community" | "city" | "state";
  currentLabel: string;
  citySlug: string;
  cityName: string;
  stateSlug: string;
  stateName: string;
  basePath: string;
  category?: CategoryKey;
}

export function ScopeBar(props: ScopeBarProps) {
  const { data: communities } = useQuery(communitiesQuery);
  const activeCommunities = (communities ?? []).filter((c) => c.is_active);

  const scopeSuffix =
    props.active === "community"
      ? `${props.cityName} • ${props.stateName}`
      : props.active === "city"
        ? props.stateName
        : "Todo o estado";

  return (
    <div className="sticky top-16 md:top-20 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Scope selector */}
        <div className="h-14 flex items-center justify-between gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 min-w-0 rounded-full border border-border bg-card px-3 py-2 text-left hover:border-brand/50 transition-colors">
              <MapPin className="size-4 text-brand shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-none truncate max-w-[45vw] md:max-w-none">
                  {props.currentLabel}
                </span>
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground truncate">
                  {scopeSuffix}
                </span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs">Comunidades</DropdownMenuLabel>
              {activeCommunities.map((c) => (
                <DropdownMenuItem key={c.id} asChild>
                  <Link
                    to="/c/$communitySlug"
                    params={{ communitySlug: c.slug }}
                    search={props.category ? { cat: props.category } : {}}
                    className="flex items-center justify-between"
                  >
                    {c.name}
                    {props.active === "community" && props.currentLabel === c.name && (
                      <Check className="size-4 text-brand" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Visão ampliada</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  to="/cidade/$citySlug"
                  params={{ citySlug: props.citySlug }}
                  search={props.category ? { cat: props.category } : {}}
                  className="flex items-center justify-between"
                >
                  Toda a cidade de {props.cityName}
                  {props.active === "city" && <Check className="size-4 text-brand" />}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/estado/$stateSlug"
                  params={{ stateSlug: props.stateSlug }}
                  search={props.category ? { cat: props.category } : {}}
                  className="flex items-center justify-between"
                >
                  Todo o estado de {props.stateName}
                  {props.active === "state" && <Check className="size-4 text-brand" />}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/anunciar"
            className="shrink-0 px-4 py-2 rounded-full bg-brand text-primary-foreground text-sm font-bold shadow-brand"
          >
            Anunciar
          </Link>
        </div>

        {/* Category filter row */}
        <div className="flex gap-2 overflow-x-auto border-t border-border py-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
          {CATEGORY_ORDER.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const isActive = props.category === cat;
            return (
              <Link
                key={cat}
                to={props.basePath}
                search={{ cat }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  isActive ? CATEGORY_SOLID[cat] : `${CATEGORY_SOFT[cat]} hover:brightness-95`
                }`}
              >
                <Icon className="size-4" />
                {VISUAL_LABELS[cat]}
              </Link>
            );
          })}
          <Link
            to="/mercado"
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors hover:brightness-95 ${CATEGORY_SOFT.mercado}`}
          >
            <ShoppingBag className="size-4" />
            Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
