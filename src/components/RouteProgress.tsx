import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function RouteProgress() {
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const t = setTimeout(() => setVisible(true), 80);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible(false), 220);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (!visible && !isLoading) return null;

  return (
    <div className="route-progress" data-done={!isLoading ? "true" : undefined}>
      <div className="route-progress-bar" />
    </div>
  );
}
