import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { PortfolioEntry } from "@/lib/professional-api";

export function PortfolioGallery({ items }: { items: PortfolioEntry[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? null : (i + 1) % items.length));
      if (e.key === "ArrowLeft")
        setOpen((i) => (i === null ? null : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  if (items.length === 0) return null;
  const current = open === null ? null : items[open];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(i)}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted group text-left"
          >
            {p.media_type === "video" ? (
              <>
                <video src={p.media_url} className="w-full h-full object-cover" muted playsInline />
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <Play className="size-8 text-background" />
                </span>
              </>
            ) : (
              <img
                src={p.media_url}
                alt={p.title ?? p.caption ?? "Trabalho realizado"}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            )}
            {p.title && (
              <span className="absolute bottom-0 inset-x-0 p-2 text-xs font-semibold text-background bg-gradient-to-t from-foreground/80 to-transparent">
                {p.title}
              </span>
            )}
          </button>
        ))}
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(null)}
            className="absolute top-4 right-4 size-10 rounded-full bg-background flex items-center justify-center"
          >
            <X className="size-5" />
          </button>
          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((i) => (i === null ? null : (i - 1 + items.length) % items.length));
                }}
                className="absolute left-2 size-10 rounded-full bg-background/90 flex items-center justify-center"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Próximo"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((i) => (i === null ? null : (i + 1) % items.length));
                }}
                className="absolute right-2 size-10 rounded-full bg-background/90 flex items-center justify-center"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
          <figure className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            {current.media_type === "video" ? (
              <video src={current.media_url} controls className="w-full max-h-[75vh] rounded-xl" />
            ) : (
              <img
                src={current.media_url}
                alt={current.title ?? current.caption ?? "Trabalho realizado"}
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
            )}
            {(current.title || current.caption) && (
              <figcaption className="mt-3 text-center text-background">
                {current.title && <p className="font-bold">{current.title}</p>}
                {current.caption && <p className="text-sm opacity-80">{current.caption}</p>}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
