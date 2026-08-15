import { Loader2 } from "lucide-react";

export function FeedCount({
  loaded,
  total,
  noun,
  nounPlural,
}: {
  loaded: number;
  total: number;
  noun: string;
  nounPlural: string;
}) {
  const label = total === 1 ? noun : nounPlural;
  return (
    <p className="text-xs text-muted-foreground">
      {total === 0
        ? `Nenhum ${noun}`
        : loaded >= total
          ? `${total} ${label}`
          : `Mostrando ${loaded} de ${total} ${label}`}
    </p>
  );
}

export function FeedPagination({
  loaded,
  total,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  loaded: number;
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  if (total === 0) return null;
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      {hasNextPage ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
          className="min-h-11 px-6 py-3 rounded-full bg-card border border-border font-bold text-sm inline-flex items-center gap-2 disabled:opacity-60 hover:border-brand transition-colors"
        >
          {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          {isFetchingNextPage ? "Carregando…" : "Ver mais anúncios"}
        </button>
      ) : (
        loaded > 0 && (
          <p className="text-xs text-muted-foreground">Você viu tudo por aqui ✨</p>
        )
      )}
    </div>
  );
}
