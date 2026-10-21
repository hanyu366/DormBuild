"use client";

import Link from "next/link";
import { useDorm } from "@/app/DormProvider";
import type { DormState } from "@/data/types";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

export default function PaymentPage() {
  const { state, session, apiPost } = useDorm();
  if (!state || !session) return null;

  const s: DormState = state;
  const myName = session.nickname;
  const isCreator = (exp: typeof s.expenses[0]) => exp.creator === myName;

  function handleConfirm(expenseId: string) {
    apiPost("expense/confirm", { expenseId, memberName: myName });
  }

  // Calendar data for June 2026
  const daysInMonth = 30;
  const firstDayOffset = 1; // June 1 is Monday
  const expenseDays = [1, 3, 8, 12, 15, 20, 24, 28]; // Days with expenses (mock)

  return (
    <div>
      <PageHeader
        title="缴费"
        rightContent={
          <Link href="/payment/report" className="btn-tan text-sm">
            月报[AI报表]
          </Link>
        }
      />

      {/* Calendar */}
      <CardShell title="">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold text-deep-olive">2026年 6月</span>
          <span className="text-sm text-muted-olive">&lt; 6月 &gt;</span>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <span key={d} className="text-xs font-bold text-muted-olive uppercase text-center">{d}</span>
          ))}
        </div>
        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Offset for first day */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <span key={`offset-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasExpense = expenseDays.includes(day);
            return (
              <span
                key={day}
                className="text-center py-1 text-sm text-olive-ink relative"
              >
                {day}
                {hasExpense && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-pill bg-posthog-orange" />
                )}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-muted-olive mt-2">
          <span className="inline-block w-1.5 h-1.5 rounded-pill bg-posthog-orange mr-1" /> 有支出记录
        </p>
      </CardShell>

      {/* Expense Cards */}
      <p className="text-sm font-bold text-deep-olive mb-2">6月1日支出记录</p>
      {state.expenses.map((exp) => {
        const confirmedCount = exp.confirmations.filter((c) => c.confirmed).length;
        const total = exp.confirmations.length;
        return (
          <CardShell key={exp.id} title="">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-deep-olive">{exp.title}</span>
              <span className="text-lg font-bold text-deep-olive">{exp.amount}元</span>
            </div>
            <p className="text-sm text-muted-olive">创建者：{exp.creator}</p>
            <p className="text-sm text-muted-olive">分摊方式：{exp.splitMethod}</p>
            <p className="text-sm text-muted-olive">人均金额：{exp.perPerson}元</p>
            <p className="text-sm text-muted-olive">备注：{exp.note}</p>

            {/* Completion */}
            <p className="text-sm text-muted-olive mt-3">完成情况：{confirmedCount}/{total}人</p>
            <div className="space-y-1 mt-2">
              {exp.confirmations.map((c) => (
                <div key={c.member} className="flex items-center gap-2 text-sm">
                  <span className="text-deep-olive">{c.member}</span>
                  <StatusBadge
                    label={c.confirmed ? "已完成" : "未完成"}
                    variant={c.confirmed ? "success" : "warning"}
                  />
                </div>
              ))}
            </div>

            {/* Role-based buttons */}
            <div className="flex gap-2 mt-4">
              {isCreator(exp) ? (
                <>
                  <button className="btn-sage text-sm">编辑</button>
                  <button className="btn-sage text-sm hover:!text-posthog-orange">删除</button>
                </>
              ) : (
                !exp.confirmations.find((c) => c.member === myName)?.confirmed && (
                  <button
                    onClick={() => handleConfirm(exp.id)}
                    className="btn-dark text-sm"
                  >
                    我已完成
                  </button>
                )
              )}
            </div>
          </CardShell>
        );
      })}

      {/* Add expense */}
      <div className="card-sage border-dashed border-2 p-4 text-center">
        <span className="text-2xl text-muted-olive">+</span>
        <p className="text-sm text-muted-olive font-semibold">新增支出记录</p>
      </div>
    </div>
  );
}
