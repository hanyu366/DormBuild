import api from "@/services/api";
import type {
  Expense,
  ExpenseBalance,
  ExpenseStats,
  ExpenseCategory,
} from "shared";

export function getExpenses(params?: {
  category?: ExpenseCategory;
  from?: string;
  to?: string;
}): Promise<Expense[]> {
  return api.get("/expenses", { params }).then((r) => r.data);
}

export function createExpense(data: {
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitMethod: string;
  note?: string;
  splits: { userId: string; amount: number }[];
}): Promise<Expense> {
  return api.post("/expenses", data).then((r) => r.data);
}

export function deleteExpense(id: string): Promise<void> {
  return api.delete(`/expenses/${id}`).then((r) => r.data);
}

export function getBalance(): Promise<ExpenseBalance[]> {
  return api.get("/expenses/balance").then((r) => r.data);
}

export function getStats(): Promise<ExpenseStats> {
  return api.get("/expenses/stats").then((r) => r.data);
}
