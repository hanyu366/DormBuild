export type ExpenseCategory = 'water' | 'electricity' | 'shared_item' | 'meal' | 'other';
export type SplitMethod = 'equal' | 'custom' | 'assigned';

export interface Expense {
  id: string;
  dormId: string;
  payerId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitMethod: SplitMethod;
  note?: string;
  createdAt: string;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  settled: boolean;
}

export interface ExpenseBalance {
  userId: string;
  nickname: string;
  totalPaid: number;
  totalShare: number;
  balance: number;
}

export interface ExpenseStats {
  totalAmount: number;
  categoryBreakdown: { category: ExpenseCategory; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
  memberRanking: { userId: string; nickname: string; totalPaid: number }[];
}
