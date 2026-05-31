export interface Vote {
  id: string;
  dormId: string;
  title: string;
  description?: string;
  isAnonymous: boolean;
  multiChoice: boolean;
  deadline?: string;
  createdBy: string;
  createdAt: string;
  options: VoteOption[];
  records: VoteRecord[];
}

export interface VoteOption {
  id: string;
  voteId: string;
  content: string;
  voteCount?: number;
}

export interface VoteRecord {
  id: string;
  voteId: string;
  optionId: string;
  userId?: string;
}
