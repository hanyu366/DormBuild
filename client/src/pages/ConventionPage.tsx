import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Plus,
  Trash2,
  Pin,
  PinOff,
  X,
  Loader2,
  AlertCircle,
  CalendarClock,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import {
  getConventions,
  createConvention,
  deleteConvention,
  togglePin,
} from "@/services/convention";
import {
  getDuties,
  createDuty,
  updateDuty,
  autoSchedule,
} from "@/services/duty";
import type { Convention, ConventionType, DutySchedule, User } from "shared";

const TYPE_TABS: { key: ConventionType | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "rule", label: "规则" },
  { key: "notice", label: "通知" },
  { key: "reminder", label: "提醒" },
];

const TYPE_LABELS: Record<ConventionType, string> = {
  rule: "规则",
  notice: "通知",
  reminder: "提醒",
  duty: "值日",
};

const TYPE_COLORS: Record<ConventionType, string> = {
  rule: "bg-blue-100 text-blue-700",
  notice: "bg-amber-100 text-amber-700",
  reminder: "bg-purple-100 text-purple-700",
  duty: "bg-green-100 text-green-700",
};

const DUTY_TYPE_LABELS: Record<string, string> = {
  cleaning: "打扫卫生",
  trash: "倒垃圾",
  other: "其他",
};

const DUTY_TYPE_COLORS: Record<string, string> = {
  cleaning: "bg-sky-100 text-sky-700",
  trash: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
};

const DUTY_TYPE_OPTIONS = [
  { key: "cleaning", label: "打扫卫生" },
  { key: "trash", label: "倒垃圾" },
  { key: "other", label: "其他" },
];

export function ConventionPage() {
  const [activeTab, setActiveTab] = useState<ConventionType | "all">("all");
  const [showAddConvention, setShowAddConvention] = useState(false);
  const [showAddDuty, setShowAddDuty] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const queryClient = useQueryClient();

  const { data: conventions = [], isLoading: conventionsLoading, error: conventionsError } = useQuery<Convention[]>({
    queryKey: ["conventions", activeTab],
    queryFn: () =>
      getConventions(activeTab === "all" ? undefined : { type: activeTab }),
  });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const displayStart = addDays(weekStart, weekOffset * 7);
  const displayEnd = addDays(displayStart, 6);

  const { data: duties = [], isLoading: dutiesLoading, error: dutiesError } = useQuery<DutySchedule[]>({
    queryKey: ["duties", format(displayStart, "yyyy-MM-dd"), format(displayEnd, "yyyy-MM-dd")],
    queryFn: () =>
      getDuties({
        from: format(displayStart, "yyyy-MM-dd"),
        to: format(displayEnd, "yyyy-MM-dd"),
      }),
  });

  const { data: members = [] } = useQuery<User[]>({
    queryKey: ["dorm-members"],
    queryFn: () => api.get("/dorm/members").then((r) => r.data),
  });

  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.id] = m.nickname;
    }
    return map;
  }, [members]);

  const sortedConventions = useMemo(() => {
    return [...conventions].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [conventions]);

  const createConventionMutation = useMutation({
    mutationFn: createConvention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      setShowAddConvention(false);
    },
  });

  const deleteConventionMutation = useMutation({
    mutationFn: deleteConvention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: togglePin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
    },
  });

  const createDutyMutation = useMutation({
    mutationFn: createDuty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      setShowAddDuty(false);
    },
  });

  const updateDutyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { completed?: boolean } }) =>
      updateDuty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
    },
  });

  const autoScheduleMutation = useMutation({
    mutationFn: autoSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
    },
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(displayStart, i));
  }, [displayStart]);

  const dutiesByDate = useMemo(() => {
    const map: Record<string, DutySchedule[]> = {};
    for (const d of duties) {
      if (!map[d.dutyDate]) map[d.dutyDate] = [];
      map[d.dutyDate].push(d);
    }
    return map;
  }, [duties]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">公约板</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          宿舍规则与值日安排
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">公约板</h3>
          <button
            onClick={() => setShowAddConvention(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            添加公约
          </button>
        </div>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {conventionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : conventionsError ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-2 text-sm text-muted-foreground">加载失败，请重试</p>
          </div>
        ) : sortedConventions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">暂无公约</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedConventions.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow",
                  conv.pinned ? "border-primary/30 bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {conv.pinned && (
                        <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <h4 className="font-semibold text-card-foreground truncate">
                        {conv.title}
                      </h4>
                      <span
                        className={cn(
                          "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          TYPE_COLORS[conv.type]
                        )}
                      >
                        {TYPE_LABELS[conv.type]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {conv.content}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {format(parseISO(conv.createdAt), "yyyy年MM月dd日 HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePinMutation.mutate(conv.id)}
                      disabled={togglePinMutation.isPending}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      title={conv.pinned ? "取消置顶" : "置顶"}
                    >
                      {conv.pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteConventionMutation.mutate(conv.id)}
                      disabled={deleteConventionMutation.isPending}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">值日安排</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => autoScheduleMutation.mutate({ days: 7 })}
              disabled={autoScheduleMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {autoScheduleMutation.isPending ? "生成中..." : "自动排班"}
            </button>
            <button
              onClick={() => setShowAddDuty(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              添加值日
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            上一周
          </button>
          <span className="text-sm font-medium text-foreground">
            {format(displayStart, "MM/dd", { locale: zhCN })} - {format(displayEnd, "MM/dd", { locale: zhCN })}
          </span>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            下一周
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
            >
              本周
            </button>
          )}
        </div>

        {dutiesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : dutiesError ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-2 text-sm text-muted-foreground">加载失败，请重试</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayDuties = dutiesByDate[dateStr] ?? [];
              const dayLabel = format(day, "EEEE", { locale: zhCN });
              const dateLabel = format(day, "MM/dd");

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "rounded-xl border bg-card p-4 shadow-sm min-h-[120px]",
                    dateStr === format(new Date(), "yyyy-MM-dd")
                      ? "border-primary/40 bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold text-card-foreground">
                      {dayLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateLabel}
                    </span>
                  </div>
                  {dayDuties.length === 0 ? (
                    <p className="text-xs text-muted-foreground">暂无安排</p>
                  ) : (
                    <div className="space-y-2">
                      {dayDuties.map((duty) => (
                        <div
                          key={duty.id}
                          className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={duty.completed}
                            onChange={(e) =>
                              updateDutyMutation.mutate({
                                id: duty.id,
                                data: { completed: e.target.checked },
                              })
                            }
                            disabled={updateDutyMutation.isPending}
                            className="h-4 w-4 rounded border-input shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                duty.completed
                                  ? "text-muted-foreground line-through"
                                  : "text-card-foreground"
                              )}
                            >
                              {memberMap[duty.userId] ?? "未知"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              DUTY_TYPE_COLORS[duty.dutyType] ?? DUTY_TYPE_COLORS.other
                            )}
                          >
                            {DUTY_TYPE_LABELS[duty.dutyType] ?? duty.dutyType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showAddConvention && (
        <AddConventionModal
          onClose={() => setShowAddConvention(false)}
          onSubmit={(data) => createConventionMutation.mutate(data)}
          submitting={createConventionMutation.isPending}
          error={createConventionMutation.error?.message}
        />
      )}

      {showAddDuty && (
        <AddDutyModal
          members={members}
          onClose={() => setShowAddDuty(false)}
          onSubmit={(data) => createDutyMutation.mutate(data)}
          submitting={createDutyMutation.isPending}
          error={createDutyMutation.error?.message}
        />
      )}
    </div>
  );
}

function AddConventionModal({
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: { type: ConventionType; title: string; content: string }) => void;
  submitting: boolean;
  error?: string;
}) {
  const [type, setType] = useState<ConventionType>("rule");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ type, title: title.trim(), content: content.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-card-foreground">添加公约</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              类型
            </label>
            <div className="flex gap-2">
              {(["rule", "notice", "reminder"] as ConventionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                    type === t
                      ? TYPE_COLORS[t]
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="公约标题"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="公约内容"
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "提交中..." : "添加公约"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddDutyModal({
  members,
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  members: User[];
  onClose: () => void;
  onSubmit: (data: { userId: string; dutyDate: string; dutyType: string }) => void;
  submitting: boolean;
  error?: string;
}) {
  const [userId, setUserId] = useState(members[0]?.id ?? "");
  const [dutyDate, setDutyDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dutyType, setDutyType] = useState("cleaning");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !dutyDate) return;
    onSubmit({ userId, dutyDate, dutyType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-card-foreground">添加值日</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              成员
            </label>
            <div className="relative">
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2.5 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nickname}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              日期
            </label>
            <input
              type="date"
              value={dutyDate}
              onChange={(e) => setDutyDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              值日类型
            </label>
            <div className="flex gap-2">
              {DUTY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDutyType(opt.key)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                    dutyType === opt.key
                      ? DUTY_TYPE_COLORS[opt.key]
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !userId || !dutyDate}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "提交中..." : "添加值日"}
          </button>
        </form>
      </div>
    </div>
  );
}
