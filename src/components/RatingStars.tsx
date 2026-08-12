import { Star } from "lucide-react";

export function RatingStars({
  value,
  size = 14,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const cls = filled ? "fill-current text-cat-profissional" : "text-muted-foreground";
        if (!onChange) {
          return <Star key={n} style={{ width: size, height: size }} className={cls} />;
        }
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            className="p-0.5"
          >
            <Star style={{ width: size, height: size }} className={cls} />
          </button>
        );
      })}
    </span>
  );
}
