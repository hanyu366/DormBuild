import api from "@/services/api";

interface DormInfo {
  id: string;
  nickname: string;
  avatar?: string;
  dormId: string | null;
  dorm: {
    id: string;
    name: string;
    inviteCode: string;
    createdAt: string;
  } | null;
}

export function getDormInfo(): Promise<DormInfo> {
  return api.get("/auth/me").then((r) => r.data);
}

export function getMembers(): Promise<
  { id: string; nickname: string; avatar?: string; createdAt: string }[]
> {
  return api.get("/dorm/members").then((r) => r.data);
}
