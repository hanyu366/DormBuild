import api from "@/services/api";
import type { AnonymousMessage } from "shared";

export function getMessages(): Promise<AnonymousMessage[]> {
  return api.get("/anonymous").then((r) => r.data);
}

export function createMessage(content: string): Promise<AnonymousMessage> {
  return api.post("/anonymous", { content }).then((r) => r.data);
}

export function likeMessage(id: string): Promise<void> {
  return api.post(`/anonymous/${id}/like`).then((r) => r.data);
}
