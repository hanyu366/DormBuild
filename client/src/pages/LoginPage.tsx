import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";
import type { Dorm } from "shared";

export function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDormDialog, setShowDormDialog] = useState(false);
  const [dormName, setDormName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [dormAction, setDormAction] = useState<"create" | "join">("create");

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(nickname, password);
      } else {
        await register(nickname, password);
      }
      setShowDormDialog(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "操作失败，请重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDormAction = async () => {
    try {
      if (dormAction === "create") {
        await api.post<Dorm>("/dorm", { name: dormName });
      } else {
        await api.post("/dorm/join", { inviteCode });
      }
      navigate("/dashboard");
    } catch {
      setError("操作失败，请重试");
    }
  };

  if (showDormDialog && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-card-foreground">
              欢迎，{user.nickname}！
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              创建或加入一个宿舍开始使用
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setDormAction("create")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                dormAction === "create"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              创建宿舍
            </button>
            <button
              onClick={() => setDormAction("join")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                dormAction === "join"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              加入宿舍
            </button>
          </div>

          {dormAction === "create" ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="宿舍名称"
                value={dormName}
                onChange={(e) => setDormName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleDormAction}
                disabled={!dormName.trim()}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleDormAction}
                disabled={!inviteCode.trim()}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                加入
              </button>
            </div>
          )}

          {user.dormId && (
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full text-sm text-primary hover:underline"
            >
              已有宿舍，直接进入 →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">DormBuild</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            宿舍生活，一起管理
          </p>
        </div>

        <div className="flex gap-2 rounded-lg bg-muted p-1">
          <button
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "register"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "处理中..." : tab === "login" ? "登录" : "注册"}
          </button>
        </form>
      </div>
    </div>
  );
}
