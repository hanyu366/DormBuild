import type { DormState } from "@/data/types";

const CHANNEL_NAME = "dormmate_sync";

let channel: BroadcastChannel | null = null;

export function initBroadcast(dormCode: string, onMessage: (state: DormState) => void): void {
  closeBroadcast();
  try {
    channel = new BroadcastChannel(`${CHANNEL_NAME}:${dormCode}`);
    channel.onmessage = (event) => {
      if (event.data?.type === "state_update" && event.data.state?.dormCode === dormCode) {
        onMessage(event.data.state);
      }
    };
  } catch {
    // The local page remains usable when BroadcastChannel is unavailable.
  }
}

export function broadcastStateUpdate(state: DormState): void {
  if (channel?.name === `${CHANNEL_NAME}:${state.dormCode}`) {
    channel.postMessage({ type: "state_update", state });
  }
}

export function closeBroadcast(): void {
  if (channel) channel.close();
  channel = null;
}
