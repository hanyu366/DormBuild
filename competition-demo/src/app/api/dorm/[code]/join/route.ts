import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";
import type { DormMember } from "@/data/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { nickname, role } = await request.json();

  const state = loadServerDormState(code);

  // Add member if not already present
  const existing = state.members.find((m) => m.name === nickname);
  if (!existing) {
    state.members.push({
      id: String(state.members.length + 1),
      name: nickname,
      role: role || "member",
      status: "",
      avatarInitial: nickname.slice(-1),
    });
  }

  saveServerDormState(state);
  return NextResponse.json(state);
}
