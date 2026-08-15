import { useEffect, useState } from "react";
import { useInfiniteQuery, type UseInfiniteQueryOptions } from "@tanstack/react-query";
import type { Page } from "@/lib/paging";

/** Debounces a value (used for search inputs so we don't hit the server on every key). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Wraps an infinite query built with `infiniteQueryOptions` and exposes a flat
 * list plus pagination helpers used by every feed.
 */
export function usePagedFeed<T>(options: any) {
  const query = useInfiniteQuery(options as UseInfiniteQueryOptions<any, any, any, any, any>);
  const pages = ((query.data as { pages?: Page<T>[] } | undefined)?.pages ?? []) as Page<T>[];
  const items = pages.flatMap((p) => p.items);
  const total = pages[0]?.total ?? 0;
  return {
    items,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage(),
  };
}
