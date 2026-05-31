export type ConventionType = 'rule' | 'notice' | 'reminder' | 'duty';

export interface Convention {
  id: string;
  dormId: string;
  type: ConventionType;
  title: string;
  content: string;
  pinned: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
}
