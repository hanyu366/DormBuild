import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  ScrollText,
  Vote,
  MessageCircle,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "总览", icon: LayoutDashboard },
  { path: "/expense", label: "记账", icon: Receipt },
  { path: "/convention", label: "公约板", icon: ScrollText },
  { path: "/vote", label: "投票", icon: Vote },
  { path: "/anonymous", label: "悄悄话", icon: MessageCircle },
  { path: "/weather", label: "天气", icon: Cloud },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-sidebar-background">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold text-sidebar-primary">DormBuild</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
