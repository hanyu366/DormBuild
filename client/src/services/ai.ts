import { useAuthStore } from "@/stores/auth";

export function chatStream(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
): AbortController {
  const controller = new AbortController();
  const token = useAuthStore.getState().token;

  fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
    signal: controller.signal,
  })
    .then(async (response) => {
      const reader = response.body?.getReader();
      if (!reader) {
        onDone();
        return;
      }
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {
              onChunk(payload);
            }
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onDone();
      }
    });

  return controller;
}

export async function parseExpense(text: string): Promise<{
  title: string;
  amount: number;
  category: string;
  splitMethod: string;
  note?: string;
}> {
  const { data } = await fetch("/api/ai/parse-expense", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${useAuthStore.getState().token}`,
    },
    body: JSON.stringify({ text }),
  }).then((r) => r.json());
  return data;
}

export async function parseDuty(text: string): Promise<{
  userId: string;
  dutyDate: string;
  dutyType: string;
}> {
  const { data } = await fetch("/api/ai/parse-duty", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${useAuthStore.getState().token}`,
    },
    body: JSON.stringify({ text }),
  }).then((r) => r.json());
  return data;
}
