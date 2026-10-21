"use client";

import { useDorm } from "@/app/DormProvider";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import StatusBadge from "@/components/StatusBadge";

export default function AnnouncementPage() {
  const { state, apiPost } = useDorm();
  if (!state) return null;

  const pinned = state.announcements.find((a) => a.pinned);

  function handleRead() {
    if (!pinned) return;
    apiPost("announcement/read", { announcementId: pinned.id });
  }

  return (
    <div>
      <PageHeader title="公告栏" showBack backHref="/dashboard" />

      {/* Add Announcement */}
      <CardShell variant="sage" className="border-dashed !border-2">
        <div className="text-center py-2">
          <span className="text-2xl text-muted-olive">+</span>
          <p className="text-sm text-muted-olive font-semibold">添加公告</p>
        </div>
      </CardShell>

      {/* Pinned Announcement */}
      {pinned && (
        <CardShell title="">
          <span className="text-xs font-bold text-posthog-orange uppercase">📌 置顶公告</span>
          <h3 className="text-lg font-bold text-deep-olive mt-2">{pinned.title}</h3>
          <p className="text-sm text-muted-olive">{pinned.date} · {pinned.author}发布</p>
          <p className="text-sm text-olive-ink mt-2 leading-relaxed">{pinned.content}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-olive">已读 {pinned.readCount}/{pinned.totalMembers}</span>
            {!pinned.readByMe && (
              <button onClick={handleRead} className="btn-sage text-sm">我知道了</button>
            )}
            {pinned.readByMe && (
              <StatusBadge label="已读" variant="success" />
            )}
          </div>
        </CardShell>
      )}
    </div>
  );
}
