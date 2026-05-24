import { Link } from "@tanstack/react-router";
import { MapPin, Building2, Map } from "lucide-react";

interface ScopeSwitcherProps {
  active: "community" | "city" | "state";
  communitySlug: string;
  communityName: string;
  citySlug: string;
  cityName: string;
  stateSlug: string;
  stateName: string;
}

export function ScopeSwitcher(props: ScopeSwitcherProps) {
  const { active } = props;
  const item = (
    isActive: boolean,
    to: string,
    Icon: typeof MapPin,
    label: string,
    sublabel: string,
  ) => (
    <Link
      to={to}
      className={`flex-1 min-w-[140px] flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
        isActive
          ? "bg-brand text-primary-foreground border-brand shadow-brand"
          : "bg-card border-border hover:border-brand/40"
      }`}
    >
      <Icon className={`size-5 shrink-0 ${isActive ? "" : "text-brand"}`} />
      <div className="text-left min-w-0">
        <div className="text-xs uppercase tracking-wide opacity-70">{sublabel}</div>
        <div className="font-bold text-sm truncate">{label}</div>
      </div>
    </Link>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {item(
        active === "community",
        `/c/${props.communitySlug}`,
        MapPin,
        props.communityName,
        "Comunidade",
      )}
      {item(
        active === "city",
        `/cidade/${props.citySlug}`,
        Building2,
        props.cityName,
        "Cidade",
      )}
      {item(
        active === "state",
        `/estado/${props.stateSlug}`,
        Map,
        props.stateName,
        "Estado",
      )}
    </div>
  );
}
