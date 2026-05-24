import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  CATEGORY_SLUG_TO_KEY,
  DEFAULT_COMMUNITY_SLUG,
  getStoredCommunitySlug,
} from "@/lib/community";

function redirectFromLegacyCategory(slug: string) {
  return () => {
    const cat = CATEGORY_SLUG_TO_KEY[slug];
    const community = getStoredCommunitySlug() ?? DEFAULT_COMMUNITY_SLUG;
    throw redirect({
      to: "/c/$communitySlug",
      params: { communitySlug: community },
      search: cat ? { cat } : {},
    });
  };
}

export const legacyCategoryRoute = (slug: string) =>
  createFileRoute(`/${slug}` as never)({
    beforeLoad: redirectFromLegacyCategory(slug),
    component: () => null,
  });
