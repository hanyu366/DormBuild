"use client";

import { useState } from "react";
import { useDorm } from "@/app/DormProvider";
import type { DormState } from "@/data/types";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";
import { laundryForecastDays } from "@/data/mock";

export default function LaundryPage() {
  const { state, apiPost, session } = useDorm();
  const [selectedDay, setSelectedDay] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [dryType, setDryType] = useState("轻薄衣物");
  const [collectTime, setCollectTime] = useState("22:00");

  if (!state || !session) return null;

  const s: DormState = state;
  const myName = session.nickname;
  const laundry = s.laundry;
  const balcony = s.balcony;

  function handleCollect() {
    apiPost("laundry/collect", { userName: myName });
  }

  function handleDry() {
    apiPost("laundry/dry", { userName: myName, type: dryType, collectTime });
    setShowModal(false);
  }

  return (
    <div>
      <PageHeader title="洗晒" />

      {/* Date Picker */}
      <CardShell title="选择日期">
        <div className="grid grid-cols-4 gap-2">
          {laundryForecastDays.map((day, i) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(i)}
              className={`text-center py-2 rounded-[4px] transition-colors ${
                selectedDay === i
                  ? "bg-sage-cream border border-sage-border text-deep-olive"
                  : "hover:bg-hover-white hover:text-posthog-orange text-olive-ink"
              }`}
            >
              <span className="text-sm font-semibold">{day.label}</span>
              <span className="text-xs text-muted-olive block">{day.date}</span>
              <span className="text-lg">{day.icon}</span>
            </button>
          ))}
        </div>
      </CardShell>

      {/* Laundry Index */}
      <CardShell variant="sage" title="今日洗晒">
        <p className="text-base font-semibold text-deep-olive">
          {laundry.weatherIcon} {laundry.weather} {laundry.temperature}
        </p>
        <p className="text-sm text-olive-ink mt-1">
          洗晒指数：<strong className="text-posthog-orange">{laundry.index}</strong> {laundry.suitable ? "适合洗晒" : "不适合洗晒"}
        </p>
        <p className="text-sm text-muted-olive">预计晾晒时长：{laundry.dryingHours}</p>
        <p className="text-sm text-muted-olive leading-relaxed mt-1">
          提醒：{laundry.suggestion}
        </p>
      </CardShell>

      {/* Balcony Occupancy */}
      <CardShell title="阳台占用情况">
        <p className="text-base font-semibold text-deep-olive">
          当前占用：<strong>{balcony.slots.length}</strong> / {balcony.totalSlots} 个位置
        </p>
        <p className="text-sm text-muted-olive">
          剩余位置：{balcony.totalSlots - balcony.slots.length} 个
        </p>

        {balcony.slots.length > 0 && (
          <div className="space-y-2 mt-3">
            {balcony.slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-deep-olive">{slot.user}</span>
                <StatusBadge label={slot.type} variant="default" />
                <span className="text-muted-olive">{slot.collectTime}收衣</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowModal(true)}
            className="btn-dark text-sm"
            disabled={balcony.slots.length >= balcony.totalSlots}
          >
            我要晾晒
          </button>
          <button onClick={handleCollect} className="btn-sage text-sm">我已收衣</button>
        </div>
      </CardShell>

      {/* AI Suggestion */}
      <CardShell variant="sage" title="AI 轻量建议">
        <p className="text-sm text-muted-olive leading-relaxed">
          天气良好，还有 {balcony.totalSlots - balcony.slots.length} 个空位，优先轻薄衣物。厚外套建议错峰晾晒。
        </p>
      </CardShell>

      {/* Dry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]" onClick={() => setShowModal(false)} />
          <div className="relative bg-warm-parchment border-t border-sage-border rounded-t-lg shadow-deep max-w-2xl w-full p-5">
            <h3 className="text-lg font-bold text-deep-olive mb-4">我要晾晒</h3>

            {/* Type selection */}
            <div className="flex gap-2 mb-4">
              {["轻薄衣物", "床单", "厚外套"].map((t) => (
                <button
                  key={t}
                  onClick={() => setDryType(t)}
                  className={`px-3 py-2 rounded-[4px] text-sm font-semibold transition ${
                    dryType === t
                      ? "bg-near-black text-white"
                      : "bg-light-sage text-olive-ink border border-sage-border hover:text-posthog-orange"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Collect time */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-deep-olive block mb-1">预计收衣时间</label>
              <input
                type="text"
                value={collectTime}
                onChange={(e) => setCollectTime(e.target.value)}
                className="input-default"
                placeholder="22:00"
              />
            </div>

            <p className="text-sm text-muted-olive">占用位置：1 个</p>
            <p className="text-xs text-muted-olive mt-1">当前还剩 {balcony.totalSlots - balcony.slots.length} 个空位</p>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="btn-sage flex-1 text-center">取消</button>
              <button onClick={handleDry} className="btn-dark flex-1 text-center">确认晾晒</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
