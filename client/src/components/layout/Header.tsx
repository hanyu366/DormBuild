import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { NotificationCenter } from "@/components/notification/NotificationCenter";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <h1 className="text-lg font-semibold text-primary md:hidden">
          DormBuild
        </h1>
        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <NotificationCenter />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
              {user?.nickname?.charAt(0) ?? "?"}
            </div>
            <span className="hidden md:inline text-sm font-medium">
              {user?.nickname}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
