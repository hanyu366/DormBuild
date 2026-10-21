"use client";

import Link from "next/link";
import { useDorm } from "@/app/DormProvider";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

function statusVariant(status: string) {
  if (status === "熟睡" || status === "在寝") return "success";
  if (status === "晚归" || status === "未完成") return "warning";
  if (status === "勿扰") return "danger";
  return "default";
}

export default function DashboardPage() {
  const { state, session, apiPost } = useDorm();
  if (!state || !session) return null;

  const ann = state.announcements.find((a) => a.pinned);

  // Dynamic task list
  const dutyDone = state.todayDuty.status === "已完成";
  const mySlot = state.balcony.slots.find((s) => s.user === session.nickname);
  const laundryDone = !mySlot;
  const expenseConfirmed = state.expenses.every(
    (exp) => exp.confirmations.find((c) => c.member === session.nickname)?.confirmed
  );

  const allTasks = [
    { key: "duty", icon: "🧹", label: "值扫", done: dutyDone, doneText: "值扫已完成" },
    { key: "laundry", icon: "👕", label: "收衣", done: laundryDone, doneText: "收衣已完成" },
    { key: "expense", icon: "💰", label: "缴费", done: expenseConfirmed, doneText: `水电${state.utility.perPerson}元已确认` },
  ];

  const doneCount = allTasks.filter((t) => t.done).length;
  const total = allTasks.length;

  return (
    <div>
      {/* Header */}
      <header className="flex items-center justify-between py-3 mb-2">
        <div>
          <h1 className="text-xl font-extrabold text-deep-olive">DormMate AI</h1>
          <p className="text-sm text-muted-olive">{state.dormCode} · {session.nickname} · {session.role === "leader" ? "舍长" : "舍友"}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/announcement" className="text-olive-ink hover:text-posthog-orange transition-colors">
            🔔
          </Link>
          <Link href="/profile" className="text-olive-ink hover:text-posthog-orange transition-colors">
            👤
          </Link>
        </div>
      </header>

      {/* Announcement Banner */}
      {ann && (
        <Link href="/announcement" className="block mb-4">
          <div className="card-sage p-3 hover:text-posthog-orange transition-colors">
            <span className="text-sm font-bold text-posthog-orange">[公告]</span>
            <span className="text-sm text-olive-ink ml-1">{ann.title}</span>
          </div>
        </Link>
      )}

      {/* Roommate Status */}
      <CardShell title="舍友状态">
        <div className="space-y-2">
          {state.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-1">
              <span className="w-8 h-8 rounded-pill bg-light-sage flex items-center justify-center text-sm font-bold text-olive-ink">
                {m.avatarInitial}
              </span>
              <span className="text-sm font-semibold text-deep-olive">{m.name}</span>
              <StatusBadge label={m.status || "在寝"} variant={statusVariant(m.status)} />
            </div>
          ))}
        </div>
      </CardShell>

      {/* Today Tasks */}
      <CardShell title={`今日任务 ${doneCount}/${total}`}>
        {/* Progress bar */}
        <div className="bg-sage-cream rounded-[4px] h-2 mb-4">
          <div className="bg-light-sage rounded-[4px] h-2" style={{ width: `${(doneCount / total) * 100}%` }} />
        </div>

        {/* Incomplete */}
        {allTasks.some((t) => !t.done) && (
          <>
            <p className="text-xs font-bold text-muted-olive uppercase mb-2">未完成</p>
            <div className="space-y-2 mb-4">
              {allTasks.filter((t) => !t.done).map((task) => (
                <div key={task.key} className="flex items-center justify-between py-2 border-b border-sage-border">
                  <div className="flex items-center gap-2">
                    <span>{task.icon}</span>
                    <span className="text-sm text-deep-olive">{task.label}</span>
                    {task.key === "duty" && !dutyDone && (
                      <span className="text-xs text-muted-olive">{state.todayDuty.suggestion}</span>
                    )}
                    {task.key === "laundry" && !laundryDone && mySlot && (
                      <StatusBadge label="待收衣" variant="warning" />
                    )}
                  </div>
                  {task.key === "duty" && (
                    <button onClick={() => apiPost("duty/complete", {})} className="btn-sage text-xs">完成</button>
                  )}
                  {task.key === "laundry" && (
                    <button onClick={() => apiPost("laundry/collect", { userName: session.nickname })} className="btn-sage text-xs">完成</button>
                  )}
                  {task.key === "expense" && (
                    <Link href="/payment" className="btn-sage text-xs">确认</Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Complete */}
        {allTasks.some((t) => t.done) && (
          <>
            <p className="text-xs font-bold text-muted-olive uppercase mb-2">已完成</p>
            <div className="space-y-2">
              {allTasks.filter((t) => t.done).map((task) => (
                <div key={task.key} className="flex items-center gap-2 py-2">
                  <span>✅</span>
                  <span className="text-sm text-muted-olive">{task.doneText}</span>
                  <StatusBadge label="已完成" variant="success" />
                </div>
              ))}
            </div>
          </>
        )}
      </CardShell>
    </div>
  );
}
