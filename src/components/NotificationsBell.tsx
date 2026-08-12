import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationVisual,
  notificationsQuery,
  timeAgoShort,
} from "@/lib/notifications-api";

export function NotificationsBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery(notificationsQuery(userId));
  const unread = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications", userId] });
          qc.invalidateQueries({ queryKey: ["unread-messages", userId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  const openItem = async (id: string, link: string | null, isRead: boolean) => {
    if (!isRead) {
      await markNotificationRead(id);
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
    }
    setOpen(false);
    if (link) navigate({ to: link as never });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative inline-flex items-center justify-center size-10 rounded-xl text-foreground/80 hover:bg-muted transition-colors"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,22rem)] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
          <p className="text-sm font-bold">Notificações</p>
          {unread > 0 && (
            <button
              onClick={async () => {
                await markAllNotificationsRead(userId);
                qc.invalidateQueries({ queryKey: ["notifications", userId] });
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" /> Marcar lidas
            </button>
          )}
        </div>
        <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
          {items.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhuma notificação ainda.
            </li>
          ) : (
            items.slice(0, 12).map((n) => {
              const v = notificationVisual(n.type);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => openItem(n.id, n.link_path, !!n.read_at)}
                    className={`w-full text-left flex gap-2.5 px-3.5 py-3 hover:bg-surface transition-colors ${
                      n.read_at ? "" : "bg-brand-soft/40"
                    }`}
                  >
                    <span
                      className={`size-8 shrink-0 rounded-lg flex items-center justify-center text-sm ${v.tone}`}
                    >
                      {v.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{n.title}</span>
                      {n.body && (
                        <span className="block text-xs text-muted-foreground truncate">{n.body}</span>
                      )}
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {timeAgoShort(n.created_at)}
                      </span>
                    </span>
                    {!n.read_at && <span className="mt-1.5 size-2 rounded-full bg-brand shrink-0" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <button
          onClick={() => {
            setOpen(false);
            navigate({ to: "/conta/notificacoes" });
          }}
          className="w-full py-2.5 text-xs font-semibold text-brand border-t border-border hover:bg-surface"
        >
          Ver todas
        </button>
      </PopoverContent>
    </Popover>
  );
}
