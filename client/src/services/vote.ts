import api from "@/services/api";
import type { Vote } from "shared";

export interface VoteResultOption {
  id: string;
  content: string;
  count: number;
  percentage: number;
}

export interface VoteResult {
  id: string;
  title: string;
  totalVotes: number;
  options: VoteResultOption[];
}

export function getVotes(): Promise<Vote[]> {
  return api.get("/votes").then((r) => r.data);
}

export function createVote(data: {
  title: string;
  description?: string;
  isAnonymous: boolean;
  multiChoice: boolean;
  deadline?: string;
  options: string[];
}): Promise<Vote> {
  return api.post("/votes", data).then((r) => r.data);
}

export function castVote(voteId: string, optionIds: string[]): Promise<void> {
  return api.post(`/votes/${voteId}/vote`, { optionIds }).then((r) => r.data);
}

export function getVoteResult(voteId: string): Promise<VoteResult> {
  return api.get(`/votes/${voteId}/result`).then((r) => r.data);
}
