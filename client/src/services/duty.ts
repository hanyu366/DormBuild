import api from "@/services/api";
import type { DutySchedule } from "shared";

export function getDuties(params?: {
  from?: string;
  to?: string;
}): Promise<DutySchedule[]> {
  return api.get("/duties", { params }).then((r) => r.data);
}

export function createDuty(data: {
  userId: string;
  dutyDate: string;
  dutyType: string;
}): Promise<DutySchedule> {
  return api.post("/duties", data).then((r) => r.data);
}

export function updateDuty(
  id: string,
  data: { completed?: boolean }
): Promise<DutySchedule> {
  return api.patch(`/duties/${id}`, data).then((r) => r.data);
}

export function autoSchedule(data: {
  days?: number;
  dutyType?: string;
}): Promise<DutySchedule[]> {
  return api.post("/duties/auto-schedule", data).then((r) => r.data);
}
