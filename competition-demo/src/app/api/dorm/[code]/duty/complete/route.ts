import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const state = loadServerDormState(code);
  state.todayDuty = { ...state.todayDuty, status: "已完成" };
  saveServerDormState(state);
  return NextResponse.json(state);
}
