import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Plus,
  Trash2,
  Receipt,
  HandCoins,
  BarChart3,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getBalance,
  getStats,
} from "@/services/expense";
import api from "@/services/api";
import type {
  Expense,
  ExpenseCategory,
  SplitMethod,
  User,
} from "shared";

const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  water: "水电",
  electricity: "电费",
  shared_item: "公用物品",
  meal: "聚餐",
  other: "其他",
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  water: "bg-blue-100 text-blue-700",
  electricity: "bg-yellow-100 text-yellow-700",
  shared_item: "bg-green-100 text-green-700",
  meal: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
};

const PIE_COLORS = ["#3b82f6", "#eab308", "#22c55e", "#f97316", "#6b7280"];

const TABS = [
  { key: "bills" as const, label: "账单", icon: Receipt },
  { key: "settle" as const, label: "结算", icon: HandCoins },
  { key: "stats" as const, label: "统计", icon: BarChart3 },
];

type TabKey = (typeof TABS)[number]["key"];

interface Member extends User {}

function computeSettlements(balances: { userId: string; nickname: string; balance: number }[]) {
  const creditors = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const settlements: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
  let i = 0;
  let j = 0;

  const debits = debtors.map((d) => ({ ...d, remaining: Math.abs(d.balance) }));
  const credits = creditors.map((c) => ({ ...c, remaining: c.balance }));

  while (i < debits.length && j < credits.length) {
    const amount = Math.min(debits[i].remaining, credits[j].remaining);
    if (amount > 0.01) {
      settlements.push({
        from: debits[i].userId,
        fromName: debits[i].nickname,
        to: credits[j].userId,
        toName: credits[j].nickname,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debits[i].remaining -= amount;
    credits[j].remaining -= amount;
    if (debits[i].remaining < 0.01) i++;
    if (credits[j].remaining < 0.01) j++;
  }

  return settlements;
}

export function ExpensePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("bills");
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["dorm-members"],
    queryFn: () => api.get("/dorm/members").then((r) => r.data),
  });

  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useQuery<Expense[]>({
    queryKey: ["expenses", categoryFilter, fromDate, toDate],
    queryFn: () =>
      getExpenses({
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      }),
  });

  const { data: balances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ["expense-balance"],
    queryFn: getBalance,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["expense-stats"],
    queryFn: getStats,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-balance"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-balance"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      setShowAddModal(false);
    },
  });

  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.id] = m.nickname;
    }
    return map;
  }, [members]);

  const settlements = useMemo(() => computeSettlements(balances), [balances]);

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (categoryFilter) {
      list = list.filter((e) => e.category === categoryFilter);
    }
    if (fromDate) {
      list = list.filter((e) => e.createdAt >= fromDate);
    }
    if (toDate) {
      list = list.filter((e) => e.createdAt <= toDate + "T23:59:59");
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [expenses, categoryFilter, fromDate, toDate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">记账</h2>
        <p className="mt-1 text-sm text-muted-foreground">管理宿舍公共开支</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "bills" && (
        <BillsTab
          expenses={filteredExpenses}
          loading={expensesLoading}
          error={expensesError}
          memberMap={memberMap}
          currentUserId={user?.id ?? ""}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          onDelete={(id) => deleteMutation.mutate(id)}
          deleting={deleteMutation.isPending}
        />
      )}

      {activeTab === "settle" && (
        <SettleTab
          balances={balances}
          settlements={settlements}
          loading={balancesLoading}
        />
      )}

      {activeTab === "stats" && (
        <StatsTab stats={stats} loading={statsLoading} />
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showAddModal && (
        <AddExpenseModal
          members={members}
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          submitting={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}
    </div>
  );
}

function BillsTab({
  expenses,
  loading,
  error,
  memberMap,
  currentUserId,
  categoryFilter,
  setCategoryFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onDelete,
  deleting,
}: {
  expenses: Expense[];
  loading: boolean;
  error: unknown;
  memberMap: Record<string, string>;
  currentUserId: string;
  categoryFilter: ExpenseCategory | "";
  setCategoryFilter: (v: ExpenseCategory | "") => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | "")}
            className="appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">全部分类</option>
            {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              )
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="开始日期"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="结束日期"
        />
        {(categoryFilter || fromDate || toDate) && (
          <button
            onClick={() => {
              setCategoryFilter("");
              setFromDate("");
              setToDate("");
            }}
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-2 text-sm text-muted-foreground">加载失败，请重试</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">暂无账单记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-card-foreground truncate">
                      {expense.title}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        CATEGORY_COLORS[expense.category]
                      )}
                    >
                      {EXPENSE_CATEGORIES[expense.category]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>
                      {memberMap[expense.payerId] ?? "未知"} 支付
                    </span>
                    <span>
                      {format(parseISO(expense.createdAt), "MM/dd HH:mm")}
                    </span>
                  </div>
                  {expense.note && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {expense.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-lg font-bold text-card-foreground">
                    ¥{expense.amount.toFixed(2)}
                  </span>
                  {expense.payerId === currentUserId && (
                    <button
                      onClick={() => onDelete(expense.id)}
                      disabled={deleting}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettleTab({
  balances,
  settlements,
  loading,
}: {
  balances: { userId: string; nickname: string; totalPaid: number; totalShare: number; balance: number }[];
  settlements: { from: string; fromName: string; to: string; toName: string; amount: number }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">暂无结算数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-card-foreground mb-4">成员余额</h3>
        <div className="space-y-3">
          {balances.map((b) => (
            <div
              key={b.userId}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-card-foreground">{b.nickname}</p>
                <p className="text-xs text-muted-foreground">
                  已付 ¥{b.totalPaid.toFixed(2)} / 应付 ¥{b.totalShare.toFixed(2)}
                </p>
              </div>
              <span
                className={cn(
                  "text-lg font-bold",
                  b.balance > 0
                    ? "text-green-600"
                    : b.balance < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                )}
              >
                {b.balance > 0 ? "+" : ""}¥{b.balance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {settlements.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">结算建议</h3>
          <div className="space-y-3">
            {settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-card-foreground">{s.fromName}</span>
                  <span className="text-muted-foreground">支付给</span>
                  <span className="font-medium text-card-foreground">{s.toName}</span>
                </div>
                <span className="font-bold text-primary">¥{s.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {settlements.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">已全部结清，无需结算 🎉</p>
        </div>
      )}
    </div>
  );
}

function StatsTab({
  stats,
  loading,
}: {
  stats: { totalAmount: number; categoryBreakdown: { category: ExpenseCategory; amount: number }[]; monthlyTrend: { month: string; amount: number }[]; memberRanking: { userId: string; nickname: string; totalPaid: number }[] } | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">暂无统计数据</p>
      </div>
    );
  }

  const pieData = stats.categoryBreakdown.map((item) => ({
    name: EXPENSE_CATEGORIES[item.category],
    value: item.amount,
    category: item.category,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">总支出</p>
        <p className="mt-1 text-3xl font-bold text-card-foreground">
          ¥{stats.totalAmount.toFixed(2)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">分类占比</h3>
          {pieData.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">月度趋势</h3>
          {stats.monthlyTrend.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-card-foreground mb-4">成员支出排行</h3>
        {stats.memberRanking.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, stats.memberRanking.length * 50 + 40)}>
            <BarChart
              data={stats.memberRanking}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="nickname"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={60}
              />
              <Tooltip
                formatter={(value: number) => `¥${value.toFixed(2)}`}
              />
              <Bar
                dataKey="totalPaid"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function AddExpenseModal({
  members,
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  members: Member[];
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    splitMethod: SplitMethod;
    note?: string;
    splits: { userId: string; amount: number }[];
  }) => void;
  submitting: boolean;
  error?: string;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [note, setNote] = useState("");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [assignedMembers, setAssignedMembers] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    members.forEach((mem) => {
      m[mem.id] = true;
    });
    return m;
  });

  const splits = useMemo(() => {
    if (splitMethod === "equal") {
      const activeMembers = members.filter((m) => assignedMembers[m.id]);
      const perPerson = parseFloat(amount) / activeMembers.length || 0;
      return activeMembers.map((m) => ({
        userId: m.id,
        amount: Math.round(perPerson * 100) / 100,
      }));
    }
    if (splitMethod === "custom") {
      return members
        .map((m) => ({
          userId: m.id,
          amount: parseFloat(customSplits[m.id] || "0") || 0,
        }))
        .filter((s) => s.amount > 0);
    }
    return members
      .filter((m) => assignedMembers[m.id])
      .map((m) => ({
        userId: m.id,
        amount: parseFloat(amount) || 0,
      }));
  }, [splitMethod, members, amount, customSplits, assignedMembers]);

  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
  const amountNum = parseFloat(amount) || 0;
  const splitMismatch = Math.abs(totalSplit - amountNum) > 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amountNum <= 0 || splits.length === 0 || splitMismatch) return;
    onSubmit({
      title: title.trim(),
      amount: amountNum,
      category,
      splitMethod,
      note: note.trim() || undefined,
      splits,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-card-foreground">添加支出</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="支出名称"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              金额
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              分类
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      category === key
                        ? CATEGORY_COLORS[key]
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              分摊方式
            </label>
            <div className="flex gap-2">
              {([
                { key: "equal" as SplitMethod, label: "均摊" },
                { key: "custom" as SplitMethod, label: "自定义" },
                { key: "assigned" as SplitMethod, label: "指定人员" },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSplitMethod(opt.key)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                    splitMethod === opt.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              备注
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选备注"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              分摊明细
            </label>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {(splitMethod === "equal" || splitMethod === "assigned") && (
                      <input
                        type="checkbox"
                        checked={assignedMembers[member.id] ?? false}
                        onChange={(e) =>
                          setAssignedMembers((prev) => ({
                            ...prev,
                            [member.id]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-input"
                      />
                    )}
                    <span className="text-sm text-card-foreground">
                      {member.nickname}
                    </span>
                  </div>
                  {splitMethod === "custom" ? (
                    <input
                      type="number"
                      value={customSplits[member.id] ?? ""}
                      onChange={(e) =>
                        setCustomSplits((prev) => ({
                          ...prev,
                          [member.id]: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : splitMethod === "equal" ? (
                    <span className="text-sm text-muted-foreground">
                      ¥{(assignedMembers[member.id] ? parseFloat(amount) / members.filter((m) => assignedMembers[m.id]).length : 0).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {assignedMembers[member.id] ? `¥${parseFloat(amount).toFixed(2)}` : "—"}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {splitMethod === "custom" && amountNum > 0 && (
              <p
                className={cn(
                  "mt-2 text-xs",
                  splitMismatch ? "text-destructive" : "text-green-600"
                )}
              >
                {splitMismatch
                  ? `分摊合计 ¥${totalSplit.toFixed(2)}，与总金额不符`
                  : `分摊合计 ¥${totalSplit.toFixed(2)}，与总金额一致`}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              !title.trim() ||
              amountNum <= 0 ||
              splits.length === 0 ||
              splitMismatch
            }
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "提交中..." : "添加支出"}
          </button>
        </form>
      </div>
    </div>
  );
}
