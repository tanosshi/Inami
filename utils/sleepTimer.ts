import { usePlayerStore } from "../store/playerStore";

let sleepTimerId: ReturnType<typeof setTimeout> | null = null;
let sleepEndTime: number | null = null;
let onTimerEndCallback: (() => void) | null = null;

export interface SleepTimerState {
  isActive: boolean;
  remainingMs: number;
  endTime: number | null;
}

export function startSleepTimer(minutes: number, onEnd?: () => void): void {
  cancelSleepTimer();

  if (minutes <= 0) return;

  const durationMs = minutes * 60 * 1000;
  sleepEndTime = Date.now() + durationMs;
  onTimerEndCallback = onEnd || null;

  sleepTimerId = setTimeout(() => {
    const playerStore = usePlayerStore.getState();
    playerStore.stopPlayback();

    if (onTimerEndCallback) {
      onTimerEndCallback();
    }

    sleepTimerId = null;
    sleepEndTime = null;
    onTimerEndCallback = null;

    console.log("Sleep timer: Playback stopped");
  }, durationMs);

  console.log(`Sleep timer: Set for ${minutes} minutes`);
}

export function cancelSleepTimer(): void {
  if (sleepTimerId) {
    clearTimeout(sleepTimerId);
    sleepTimerId = null;
    sleepEndTime = null;
    onTimerEndCallback = null;
    console.log("Sleep timer: Cancelled");
  }
}

export function isSleepTimerActive(): boolean {
  return sleepTimerId !== null && sleepEndTime !== null;
}

export function getSleepTimerRemaining(): number {
  if (!sleepEndTime) return 0;
  const remaining = sleepEndTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function getSleepTimerState(): SleepTimerState {
  return {
    isActive: isSleepTimerActive(),
    remainingMs: getSleepTimerRemaining(),
    endTime: sleepEndTime,
  };
}

export function formatRemainingTime(): string {
  const remaining = getSleepTimerRemaining();
  if (remaining <= 0) return "0:00";

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const SLEEP_TIMER_PRESETS = [
  { label: "5 minutes", minutes: 5 },
  { label: "10 minutes", minutes: 10 },
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "45 minutes", minutes: 45 },
  { label: "1 hour", minutes: 60 },
  { label: "1.5 hours", minutes: 90 },
  { label: "2 hours", minutes: 120 },
] as const;
