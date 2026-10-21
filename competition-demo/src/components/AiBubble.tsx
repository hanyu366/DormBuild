"use client";

import { useState, useRef, useEffect } from "react";
import { useDorm } from "@/app/DormProvider";

type ChatMsg = {
  role: "user" | "ai";
  text: string;
  time: string;
};

export default function AiBubble() {
  const { session, sendAiMessage } = useDorm();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !session) return;
    const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { role: "user", text: input, time: now }]);
    setThinking(true);
    const userInput = input;
    setInput("");

    const reply = await sendAiMessage(userInput);
    setMessages((prev) => [
      ...prev,
      { role: "ai", text: reply || "处理失败，请稍后再试。", time: now },
    ]);
    setThinking(false);
  }

  return (
    <>
      {/* Floating AI Badge */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-16 right-4 z-30 bg-near-black text-white rounded-pill px-3 py-1.5 text-sm font-bold hover:opacity-70 transition-opacity cursor-pointer"
      >
        ◉ AI
      </button>

      {/* Chat Panel Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]" onClick={() => setOpen(false)} />
          <div className="relative bg-warm-parchment border-t border-sage-border rounded-t-lg shadow-deep max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-sage-border">
              <span className="text-base font-bold text-deep-olive">AI 助手</span>
              <button
                onClick={() => setOpen(false)}
                className="btn-ghost text-lg"
              >
                ✕
              </button>
            </div>

            {/* Chat History */}
            <div ref={scrollRef} className="overflow-y-auto max-h-[300px] px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-light-sage text-olive-ink"
                      : "bg-sage-cream text-olive-ink"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs text-muted-olive mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="bg-sage-cream rounded-lg p-3 text-sm text-muted-olive animate-pulse">
                    思考中...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 px-4 py-3 border-t border-sage-border">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !thinking && handleSend()}
                placeholder="输入宿舍事务..."
                className="input-default flex-1"
                disabled={thinking}
              />
              <button onClick={handleSend} disabled={thinking} className="btn-dark px-4 text-sm">
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
