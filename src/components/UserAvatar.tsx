import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Avatar that always renders something: if the image is missing or fails to
 * load (e.g. legacy HEIC files browsers cannot decode) it falls back to the
 * person's initials.
 */
export function UserAvatar({
  src,
  name,
  className,
  textClassName,
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = !!src && !failed;

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden bg-brand-soft text-brand flex items-center justify-center shrink-0",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={name ? `Foto de ${name}` : ""}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={cn("font-bold", textClassName)}>{initials(name)}</span>
      )}
    </div>
  );
}
