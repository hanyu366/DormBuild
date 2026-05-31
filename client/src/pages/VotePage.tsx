import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDistanceToNow, isPast } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  Vote as VoteIcon,
  Clock,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  User,
  EyeOff,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { getVotes, createVote, castVote, getVoteResult, type VoteResult } from "@/services/vote";
import api from "@/services/api";
import type { Vote } from "shared";

const TABS = [
  { key: "active" as const, label: "进行中" },
  { key: "ended" as const, label: "已结束" },
];

type TabKey = (typeof TABS)[number]["key"];

function isVoteEnded(vote: Vote): boolean {
  if (!vote.deadline) return false;
  return isPast(new Date(vote.deadline));
}

function hasUserVoted(vote: Vote, userId: string): boolean {
  return vote.records.some((r) => r.userId === userId);
}

function Countdown({ deadline }: { deadline: string }) {
  const distance = formatDistanceToNow(new Date(deadline), {
    addSuffix: true,
    locale: zhCN,
  });
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {distance}截止
    </span>
  );
}

function VoteResultView({ voteId }: { voteId: string }) {
  const { data: result, isLoading } = useQuery<VoteResult>({
    queryKey: ["vote-result", voteId],
    queryFn: () => getVoteResult(voteId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!result) return null;

  const chartData = result.options.map((opt) => ({
    name: opt.content,
    票数: opt.count,
  }));

  return (
    <div className="space-y-4 pt-3">
      <div className="space-y-2">
        {result.options.map((opt) => (
          <div key={opt.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-card-foreground">{opt.content}</span>
              <span className="text-muted-foreground">
                {opt.count}票 ({opt.percentage}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${opt.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        共 {result.totalVotes} 人参与投票
      </p>

      {result.options.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(120, result.options.length * 40 + 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              width={80}
            />
            <Tooltip />
            <Bar dataKey="票数" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function VoteCard({
  vote,
  userId,
  memberMap,
  onVote,
  voting,
}: {
  vote: Vote;
  userId: string;
  memberMap: Record<string, string>;
  onVote: (voteId: string, optionIds: string[]) => void;
  voting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());

  const ended = isVoteEnded(vote);
  const voted = hasUserVoted(vote, userId);
  const showResult = ended || voted;

  const toggleOption = (optionId: string) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        if (!vote.multiChoice) {
          next.clear();
        }
        next.add(optionId);
      }
      return next;
    });
  };

  const totalVotes = vote.records.length;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-card-foreground truncate">
                {vote.title}
              </h3>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  vote.multiChoice
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                )}
              >
                {vote.multiChoice ? "多选" : "单选"}
              </span>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  vote.isAnonymous
                    ? "bg-gray-100 text-gray-600"
                    : "bg-green-100 text-green-700"
                )}
              >
                {vote.isAnonymous ? "匿名" : "公开"}
              </span>
              {ended && (
                <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                  已结束
                </span>
              )}
            </div>
            {vote.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {vote.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {vote.isAnonymous ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                {vote.isAnonymous ? "匿名" : memberMap[vote.createdBy] ?? "未知"}
              </span>
              {vote.deadline && <Countdown deadline={vote.deadline} />}
              <span>{totalVotes}人参与</span>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {showResult ? (
            <VoteResultView voteId={vote.id} />
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                {vote.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                      selectedOptions.has(opt.id)
                        ? "border-primary bg-primary/5 text-card-foreground"
                        : "border-border bg-background text-card-foreground hover:border-primary/50"
                    )}
                  >
                    {vote.multiChoice ? (
                      selectedOptions.has(opt.id) ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )
                    ) : (
                      <div
                        className={cn(
                          "h-4 w-4 shrink-0 rounded-full border-2",
                          selectedOptions.has(opt.id)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      />
                    )}
                    <span className="text-sm">{opt.content}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => onVote(vote.id, Array.from(selectedOptions))}
                disabled={voting || selectedOptions.size === 0}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {voting ? "提交中..." : "投票"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateVoteModal({
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    isAnonymous: boolean;
    multiChoice: boolean;
    deadline?: string;
    options: string[];
  }) => void;
  submitting: boolean;
  error?: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [multiChoice, setMultiChoice] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => setOptions((prev) => [...prev, ""]);
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };
  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const validOptions = options.filter((o) => o.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || validOptions.length < 2) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      isAnonymous,
      multiChoice,
      deadline: deadline || undefined,
      options: validOptions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-card-foreground">创建投票</h2>
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
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="投票主题"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="补充说明"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm text-card-foreground">匿名投票</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={multiChoice}
                onChange={(e) => setMultiChoice(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm text-card-foreground">多选</span>
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              截止时间（可选）
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              选项
            </label>
            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`选项 ${index + 1}`}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              添加选项
            </button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !title.trim() || validOptions.length < 2}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "创建中..." : "创建投票"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function VotePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["dorm-members"],
    queryFn: () => api.get("/dorm/members").then((r) => r.data),
  });

  const { data: votes = [], isLoading, error } = useQuery<Vote[]>({
    queryKey: ["votes"],
    queryFn: getVotes,
  });

  const createMutation = useMutation({
    mutationFn: createVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes"] });
      setShowCreateModal(false);
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ voteId, optionIds }: { voteId: string; optionIds: string[] }) =>
      castVote(voteId, optionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes"] });
    },
  });

  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.id] = m.nickname;
    }
    return map;
  }, [members]);

  const activeVotes = useMemo(
    () => votes.filter((v) => !isVoteEnded(v)),
    [votes]
  );

  const endedVotes = useMemo(
    () => votes.filter((v) => isVoteEnded(v)),
    [votes]
  );

  const currentList = activeTab === "active" ? activeVotes : endedVotes;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">投票</h2>
        <p className="mt-1 text-sm text-muted-foreground">参与宿舍事务决策</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}
            >
              {tab.key === "active" ? activeVotes.length : endedVotes.length}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-2 text-sm text-muted-foreground">加载失败，请重试</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <VoteIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {activeTab === "active" ? "暂无进行中的投票" : "暂无已结束的投票"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((vote) => (
            <VoteCard
              key={vote.id}
              vote={vote}
              userId={user?.id ?? ""}
              memberMap={memberMap}
              onVote={(voteId, optionIds) =>
                voteMutation.mutate({ voteId, optionIds })
              }
              voting={voteMutation.isPending}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showCreateModal && (
        <CreateVoteModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          submitting={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}
    </div>
  );
}
