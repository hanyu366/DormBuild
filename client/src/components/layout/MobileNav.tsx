import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, ScrollText, Cloud, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/dashboard", label: "总览", icon: LayoutDashboard },
  { path: "/expense", label: "记账", icon: Receipt },
  { path: "/convention", label: "公约", icon: ScrollText },
  { path: "/weather", label: "天气", icon: Cloud },
  { path: "/anonymous", label: "我的", icon: User },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
