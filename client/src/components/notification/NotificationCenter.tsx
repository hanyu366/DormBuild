import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/stores/notification";
import { getNotifications, markAsRead, markAllAsRead } from "@/services/notification";
import type { NotificationType } from "shared";
import { cn } from "@/lib/utils";

const typeIcons: Record<NotificationType, string> = {
  expense: "💰",
  duty: "🧹",
  vote: "🗳️",
  convention: "📋",
  anonymous: "🤫",
  weather: "🌤️",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const list = useNotificationStore((s) => s.list);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const setList = useNotificationStore((s) => s.setList);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getNotifications().then(setList).catch(() => {});
  }, [setList]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        open &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    markAllRead();
  };

  const handleNotificationClick = async (id: string) => {
    await markAsRead(id);
    markRead(id);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-background shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">通知</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  全部已读
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {list.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-sm text-muted-foreground">暂无通知</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {list.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <span className="mt-0.5 text-base shrink-0">
                        {typeIcons[n.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {n.content}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
