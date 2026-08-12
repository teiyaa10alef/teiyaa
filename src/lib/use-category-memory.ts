import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getStoredCategory, setStoredCategory, type CategoryKey } from "@/lib/community";

/**
 * Keeps the "what am I looking for" choice sticky across navigation:
 * - stores the active category whenever one is selected
 * - restores the last one when the user lands on a scope page without it
 */
export function useCategoryMemory(cat: CategoryKey | undefined) {
  const navigate = useNavigate();

  useEffect(() => {
    if (cat) {
      setStoredCategory(cat);
      return;
    }
    const stored = getStoredCategory();
    if (stored) {
      navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({ ...prev, cat: stored }),
        replace: true,
      });
    }
  }, [cat, navigate]);
}
