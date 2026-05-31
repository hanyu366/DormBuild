import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  Heart,
  MessageCircle,
  ArrowDownUp,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMessages, createMessage, likeMessage } from "@/services/anonymous";
import type { AnonymousMessage } from "shared";

type SortKey = "latest" | "hot";

const CARD_COLORS = [
  "bg-rose-50 border-rose-200",
  "bg-sky-50 border-sky-200",
  "bg-amber-50 border-amber-200",
  "bg-emerald-50 border-emerald-200",
  "bg-violet-50 border-violet-200",
  "bg-orange-50 border-orange-200",
];

function MessageCard({
  message,
  colorIndex,
  onLike,
  liking,
}: {
  message: AnonymousMessage;
  colorIndex: number;
  onLike: () => void;
  liking: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [heartScale, setHeartScale] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
    locale: zhCN,
  });

  const handleLike = () => {
    if (liked || liking) return;
    setLiked(true);
    setHeartScale(true);
    onLike();
    setTimeout(() => setHeartScale(false), 300);
  };

  return (
    <div
      className={cn(
        "break-inside-avoid mb-3 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md",
        CARD_COLORS[colorIndex % CARD_COLORS.length]
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
          <UserX className="h-3.5 w-3.5 text-gray-500" />
        </div>
        <span className="text-xs text-gray-500">匿名用户</span>
      </div>

      <p className="text-sm text-card-foreground leading-relaxed mb-3">
        {message.content}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{timeAgo}</span>
        <button
          onClick={handleLike}
          disabled={liked || liking}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all",
            liked
              ? "text-rose-500"
              : "text-gray-400 hover:text-rose-500 hover:bg-rose-50"
          )}
        >
          <Heart
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              liked && "fill-rose-500",
              heartScale && "scale-125"
            )}
          />
          <span>{message.likes + (liked ? 1 : 0)}</span>
        </button>
      </div>
    </div>
  );
}

function AddMessageModal({
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (content: string) => void;
  submitting: boolean;
  error?: string;
}) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-card-foreground">说句悄悄话</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="匿名说出你的心声..."
            rows={4}
            maxLength={500}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {content.length}/500
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "发送中..." : "发送"}
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export function AnonymousPage() {
  const [sortBy, setSortBy] = useState<SortKey>("latest");
  const [showAddModal, setShowAddModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error } = useQuery<AnonymousMessage[]>({
    queryKey: ["anonymous-messages"],
    queryFn: getMessages,
  });

  const createMutation = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anonymous-messages"] });
      setShowAddModal(false);
    },
  });

  const likeMutation = useMutation({
    mutationFn: likeMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anonymous-messages"] });
    },
  });

  const sortedMessages = useMemo(() => {
    const list = [...messages];
    if (sortBy === "hot") {
      list.sort((a, b) => b.likes - a.likes);
    }
    return list;
  }, [messages, sortBy]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">悄悄话</h2>
        <p className="mt-1 text-sm text-muted-foreground">匿名留言板</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{messages.length} 条留言</span>
        </div>
        <button
          onClick={() => setSortBy((prev) => (prev === "latest" ? "hot" : "latest"))}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-card-foreground hover:bg-muted transition-colors"
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
          {sortBy === "latest" ? "最新" : "最热"}
        </button>
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
      ) : sortedMessages.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">还没有悄悄话，来写第一条吧</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3">
          {sortedMessages.map((msg, index) => (
            <MessageCard
              key={msg.id}
              message={msg}
              colorIndex={index}
              onLike={() => likeMutation.mutate(msg.id)}
              liking={likeMutation.isPending}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showAddModal && (
        <AddMessageModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(content) => createMutation.mutate(content)}
          submitting={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}
    </div>
  );
}
