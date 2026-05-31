import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { getWeather } from "@/services/weather";
import { getExpenses } from "@/services/expense";
import { getDuties } from "@/services/duty";
import { getVotes } from "@/services/vote";
import { getMessages } from "@/services/anonymous";
import { getConventions } from "@/services/convention";
import { getDormInfo, getMembers } from "@/services/dorm";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Cloud,
  Receipt,
  ClipboardCheck,
  Vote,
  MessageCircle,
  ScrollText,
  Plus,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

function weatherEmoji(text: string): string {
  if (!text) return "🌤️";
  if (text.includes("晴")) return "☀️";
  if (text.includes("云") || text.includes("阴")) return "⛅";
  if (text.includes("雷")) return "⛈️";
  if (text.includes("雨")) return "🌧️";
  if (text.includes("雪")) return "❄️";
  if (text.includes("雾") || text.includes("霾")) return "🌫️";
  if (text.includes("风")) return "💨";
  return "🌤️";
}

function CardShell({
  onClick,
  icon,
  iconBg,
  iconColor,
  title,
  isLoading,
  children,
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200",
        onClick &&
          "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <h3 className="font-semibold text-card-foreground text-sm">{title}</h3>
        {onClick && (
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        )}
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: dormInfo } = useQuery({
    queryKey: ["dorm"],
    queryFn: getDormInfo,
  });

  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ["weather"],
    queryFn: getWeather,
  });

  const { data: monthExpenses, isLoading: expenseLoading } = useQuery({
    queryKey: ["expenses", "month"],
    queryFn: () => getExpenses({ from: monthStart, to: monthEnd }),
  });

  const { data: duties, isLoading: dutyLoading } = useQuery({
    queryKey: ["duties", "today"],
    queryFn: () => getDuties({ from: today, to: today }),
  });

  const { data: votes, isLoading: voteLoading } = useQuery({
    queryKey: ["votes"],
    queryFn: getVotes,
  });

  const { data: messages, isLoading: messageLoading } = useQuery({
    queryKey: ["anonymous"],
    queryFn: getMessages,
  });

  const { data: conventions, isLoading: conventionLoading } = useQuery({
    queryKey: ["conventions"],
    queryFn: () => getConventions(),
  });

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  const memberMap = new Map(members?.map((m) => [m.id, m.nickname]));

  const monthTotal =
    monthExpenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  const activeVotes =
    votes?.filter((v) => {
      if (!v.deadline) return true;
      return new Date(v.deadline) > new Date();
    }) ?? [];

  const pinnedConventions = conventions
    ? conventions
        .filter((c) => c.pinned)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3)
    : [];

  const latestMessages = messages?.slice(0, 3) ?? [];

  const quickActions = [
    {
      label: "记账",
      icon: Receipt,
      path: "/expense",
      color: "text-emerald-600",
      bg: "bg-emerald-50 hover:bg-emerald-100",
    },
    {
      label: "公约",
      icon: ScrollText,
      path: "/convention",
      color: "text-amber-600",
      bg: "bg-amber-50 hover:bg-amber-100",
    },
    {
      label: "投票",
      icon: Vote,
      path: "/vote",
      color: "text-violet-600",
      bg: "bg-violet-50 hover:bg-violet-100",
    },
    {
      label: "悄悄话",
      icon: MessageCircle,
      path: "/anonymous",
      color: "text-pink-600",
      bg: "bg-pink-50 hover:bg-pink-100",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          你好，{user?.nickname ?? "同学"}！欢迎回到
          {dormInfo?.dorm?.name ?? "宿舍"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(), "yyyy年M月d日 EEEE", { locale: zhCN })}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <CardShell
          onClick={() => navigate("/weather")}
          icon={<Cloud className="h-5 w-5" />}
          iconBg="bg-sky-50 dark:bg-sky-950"
          iconColor="text-sky-500"
          title="今日天气"
          isLoading={weatherLoading}
        >
          {weather ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {weatherEmoji(weather.current.text)}
                </span>
                <span className="text-2xl font-bold text-card-foreground">
                  {weather.current.temp}°C
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {weather.city} · {weather.current.text}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无天气数据</p>
          )}
        </CardShell>

        <CardShell
          onClick={() => navigate("/expense")}
          icon={<Receipt className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          iconColor="text-emerald-500"
          title="本月支出"
          isLoading={expenseLoading}
        >
          <div className="space-y-1">
            <p className="text-2xl font-bold text-card-foreground">
              ¥{monthTotal.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {monthExpenses?.length ?? 0} 笔记录
            </p>
          </div>
        </CardShell>

        <CardShell
          onClick={() => navigate("/convention")}
          icon={<ClipboardCheck className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-950"
          iconColor="text-amber-500"
          title="今日值日"
          isLoading={dutyLoading}
        >
          {duties && duties.length > 0 ? (
            <div className="space-y-1.5">
              {duties.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  {d.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm text-card-foreground truncate">
                    {memberMap.get(d.userId) ?? "未知"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">今日无值日安排</p>
          )}
        </CardShell>

        <CardShell
          onClick={() => navigate("/vote")}
          icon={<Vote className="h-5 w-5" />}
          iconBg="bg-violet-50 dark:bg-violet-950"
          iconColor="text-violet-500"
          title="进行中的投票"
          isLoading={voteLoading}
        >
          {activeVotes.length > 0 ? (
            <div className="space-y-1">
              <p className="text-2xl font-bold text-card-foreground">
                {activeVotes.length}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activeVotes[0].title}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无进行中的投票</p>
          )}
        </CardShell>

        <CardShell
          onClick={() => navigate("/anonymous")}
          icon={<MessageCircle className="h-5 w-5" />}
          iconBg="bg-pink-50 dark:bg-pink-950"
          iconColor="text-pink-500"
          title="最近悄悄话"
          isLoading={messageLoading}
        >
          {latestMessages.length > 0 ? (
            <div className="space-y-2">
              {latestMessages.map((msg) => (
                <p
                  key={msg.id}
                  className="text-xs text-muted-foreground truncate"
                >
                  {msg.content}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无悄悄话</p>
          )}
        </CardShell>

        <CardShell
          onClick={() => navigate("/convention")}
          icon={<ScrollText className="h-5 w-5" />}
          iconBg="bg-orange-50 dark:bg-orange-950"
          iconColor="text-orange-500"
          title="置顶公约"
          isLoading={conventionLoading}
        >
          {pinnedConventions.length > 0 ? (
            <div className="space-y-2">
              {pinnedConventions.map((c) => (
                <p
                  key={c.id}
                  className="text-xs text-muted-foreground truncate"
                >
                  📌 {c.title}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无置顶公约</p>
          )}
        </CardShell>
      </div>

      <div className="flex gap-3 flex-wrap">
        {quickActions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              action.bg,
              action.color
            )}
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
