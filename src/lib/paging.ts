// Shared helpers for server-side paginated feeds.
export const PAGE_SIZE = 12;

/** Removes characters that break PostgREST `or`/`ilike` filter syntax. */
export function sanitizeTerm(term: string | undefined | null): string {
  return (term ?? "")
    .trim()
    .slice(0, 80)
    .replace(/[,()*%\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Builds a PostgREST `or` expression searching the term in several columns. */
export function ilikeOr(term: string, columns: string[]): string {
  return columns.map((c) => `${c}.ilike.%${term}%`).join(",");
}

export function rangeFor(pageParam: number): [number, number] {
  const from = pageParam * PAGE_SIZE;
  return [from, from + PAGE_SIZE - 1];
}

export type Page<T> = { items: T[]; total: number; nextPage: number | null };

export function makePage<T>(items: T[], count: number | null, pageParam: number): Page<T> {
  const total = count ?? items.length;
  const loaded = pageParam * PAGE_SIZE + items.length;
  return { items, total, nextPage: loaded < total ? pageParam + 1 : null };
}
