import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userName, type, collectTime } = await request.json();

  const state = loadServerDormState(code);
  state.balcony = {
    ...state.balcony,
    slots: [...state.balcony.slots, { user: userName, type, collectTime, status: "已晾晒" }],
  };
  saveServerDormState(state);
  return NextResponse.json(state);
}
