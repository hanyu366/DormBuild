"use client";

import Link from "next/link";
import { useDorm } from "@/app/DormProvider";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

export default function DutyPage() {
  const { state, apiPost } = useDorm();
  if (!state) return null;

  const duty = state.todayDuty;
  const schedule = state.dutySchedule;

  function handleComplete() {
    apiPost("duty/complete", {});
  }

  return (
    <div>
      <PageHeader title="值扫" />

      {/* 3-day Date Slider */}
      <CardShell variant="sage" title="">
        <p className="text-sm text-muted-olive text-center mb-3">2026/05/30 - 2026/06/01</p>
        <div className="grid grid-cols-3 gap-2">
          {schedule.map((day) => (
            <div
              key={day.date}
              className={`text-center p-3 rounded-[4px] transition-colors ${
                day.isToday
                  ? "bg-sage-cream border border-sage-border"
                  : "bg-warm-parchment"
              }`}
            >
              <p className="text-sm font-bold text-deep-olive">{day.dayLabel}</p>
              <p className="text-xs text-muted-olive">{day.shortDate}</p>
              <p className="text-xs text-muted-olive">{day.itemCount}项</p>
              <StatusBadge
                label={day.statusLabel}
                variant={day.statusLabel === "已完成" ? "success" : "warning"}
              />
            </div>
          ))}
        </div>
      </CardShell>

      {/* Today's Duty Card */}
      {duty.status !== "已完成" ? (
        <CardShell title="">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-bold text-deep-olive">🧹 值日</span>
            <StatusBadge label={duty.status} variant="warning" />
          </div>
          <p className="text-sm text-deep-olive">负责人：<strong>{duty.user}</strong></p>
          <p className="text-sm text-muted-olive">区域：{duty.area}</p>
          <p className="text-sm text-muted-olive">建议：{duty.suggestion}</p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleComplete} className="btn-dark text-sm">我已完成</button>
            <Link href="/duty/swap" className="btn-sage text-sm">换班</Link>
          </div>
        </CardShell>
      ) : (
        <CardShell title="">
          <div className="text-center py-4">
            <span className="text-2xl">✅</span>
            <p className="text-sm text-muted-olive mt-2">今日值日已完成</p>
          </div>
        </CardShell>
      )}
    </div>
  );
}
