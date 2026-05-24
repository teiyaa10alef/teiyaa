import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_COMMUNITY_SLUG, getStoredCommunitySlug } from "@/lib/community";

export const Route = createFileRoute("/servicos")({
  beforeLoad: () => {
    throw redirect({
      to: "/c/$communitySlug",
      params: { communitySlug: getStoredCommunitySlug() ?? DEFAULT_COMMUNITY_SLUG },
      search: { cat: "servico" as const },
    });
  },
  component: () => null,
});
