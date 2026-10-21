"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";
import { defaultDormCode } from "@/data/mock";

export default function JoinPage() {
  const router = useRouter();
  const { joinDorm } = useDorm();
  const [nickname, setNickname] = useState("");
  const [dormCode, setDormCode] = useState(defaultDormCode);
  const [role, setRole] = useState<"member" | "leader">("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!nickname.trim()) {
      setError("昵称不能为空");
      return;
    }
    if (!dormCode.trim()) {
      setError("宿舍邀请码不能为空");
      return;
    }
    setError("");
    setLoading(true);
    await joinDorm(nickname.trim(), dormCode.trim(), role);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-deep-olive mb-2" style={{ letterSpacing: "-0.75px" }}>
            DormMate AI
          </h1>
          <p className="text-muted-olive">AI 宿舍协作看板 · 输入自然语言，轻松管理宿舍</p>
        </div>

        <div className="card-bordered p-6">
          <h2 className="text-xl font-bold text-deep-olive mb-5">加入宿舍</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-deep-olive mb-1">你的昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：小李"
                className="input-default"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-deep-olive mb-1">宿舍邀请码</label>
              <input
                type="text"
                value={dormCode}
                onChange={(e) => setDormCode(e.target.value)}
                placeholder="例如：DORM-402"
                className="input-default"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-deep-olive mb-1">你的身份</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRole("member")}
                  className={`px-4 py-2 rounded-[4px] border transition font-semibold ${
                    role === "member"
                      ? "bg-near-black text-white border-near-black"
                      : "bg-light-sage text-olive-ink border-sage-border hover:text-posthog-orange"
                  }`}
                >
                  舍友
                </button>
                <button
                  onClick={() => setRole("leader")}
                  className={`px-4 py-2 rounded-[4px] border transition font-semibold ${
                    role === "leader"
                      ? "bg-near-black text-white border-near-black"
                      : "bg-light-sage text-olive-ink border-sage-border hover:text-posthog-orange"
                  }`}
                >
                  舍长
                </button>
              </div>
            </div>

            {error && <p className="text-posthog-orange text-sm font-semibold">{error}</p>}

            <button onClick={handleJoin} disabled={loading} className="btn-dark w-full text-center">
              {loading ? "加入中..." : "进入宿舍空间"}
            </button>
          </div>
        </div>

        <p className="text-center text-sage-placeholder text-xs mt-6">
          V0.1 原型 Demo · 不做登录注册 · 数据仅存储在服务端
        </p>
      </div>
    </div>
  );
}
