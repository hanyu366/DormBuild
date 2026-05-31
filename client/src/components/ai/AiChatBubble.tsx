import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatStream } from "@/services/ai";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  structuredData?: {
    type: "expense" | "duty";
    data: Record<string, unknown>;
  };
}

const quickActions = [
  { label: "帮我记账", prompt: "帮我记一笔账" },
  { label: "排值日", prompt: "帮我安排值日" },
  { label: "本月花了多少", prompt: "本月花了多少" },
  { label: "今天天气", prompt: "今天天气怎么样" },
];

export function AiChatBubble() {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = useCallback(
    (text?: string) => {
      const content = text ?? input.trim();
      if (!content || streaming) return;

      const userMsg: ChatMessage = { role: "user", content };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setStreaming(true);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
      };
      setMessages([...updated, assistantMsg]);

      const apiMessages = updated.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const controller = chatStream(
        apiMessages,
        (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === "assistant") {
              next[next.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return next;
          });
        },
        () => {
          setStreaming(false);
          abortRef.current = null;
        },
      );
      abortRef.current = controller;
    },
    [input, messages, streaming],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
  };

  const handleFormFill = (type: "expense" | "duty") => {
    if (type === "expense") {
      navigate("/expense");
    } else if (type === "duty") {
      navigate("/dashboard");
    }
    setOpen(false);
  };

  const detectStructuredData = (msg: ChatMessage) => {
    const text = msg.content;
    if (text.includes("记账") || text.includes("金额") || text.includes("花费")) {
      return "expense" as const;
    }
    if (text.includes("值日") || text.includes("打扫") || text.includes("排班")) {
      return "duty" as const;
    }
    return null;
  };

  if (!token) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 z-50 flex h-[500px] w-[360px] flex-col rounded-2xl border border-border bg-background shadow-2xl md:bottom-6 md:right-6"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-semibold">AI 助手</span>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    有什么可以帮你的？
                  </p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                const structuredType =
                  !isUser && !streaming && i === messages.length - 1
                    ? detectStructuredData(msg)
                    : null;

                return (
                  <div key={i} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {msg.content || (streaming && !isUser && i === messages.length - 1 && (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          思考中...
                        </span>
                      ))}
                      {structuredType && (
                        <button
                          onClick={() => handleFormFill(structuredType)}
                          className="mt-2 block w-full rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          填写表单
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.prompt)}
                    disabled={streaming}
                    className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground hover:bg-accent/80 transition-colors disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息..."
                  disabled={streaming}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={streaming || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors md:bottom-6 md:right-6"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Bot className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
