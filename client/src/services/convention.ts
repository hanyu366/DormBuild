import api from "@/services/api";
import type { Convention, ConventionType } from "shared";

export function getConventions(params?: {
  type?: ConventionType;
}): Promise<Convention[]> {
  return api.get("/conventions", { params }).then((r) => r.data);
}

export function createConvention(data: {
  type: ConventionType;
  title: string;
  content: string;
}): Promise<Convention> {
  return api.post("/conventions", data).then((r) => r.data);
}

export function updateConvention(
  id: string,
  data: { title?: string; content?: string; pinned?: boolean; priority?: number }
): Promise<Convention> {
  return api.patch(`/conventions/${id}`, data).then((r) => r.data);
}

export function deleteConvention(id: string): Promise<void> {
  return api.delete(`/conventions/${id}`).then((r) => r.data);
}

export function togglePin(id: string): Promise<Convention> {
  return api.patch(`/conventions/${id}/pin`).then((r) => r.data);
}
