import { NextRequest, NextResponse } from "next/server";
import { loadServerDormState, saveServerDormState } from "@/lib/serverStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userName } = await request.json();

  const state = loadServerDormState(code);
  state.balcony = {
    ...state.balcony,
    slots: state.balcony.slots.filter((s) => s.user !== userName),
  };
  saveServerDormState(state);
  return NextResponse.json(state);
}
