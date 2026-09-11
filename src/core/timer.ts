import { parseTimestamp } from "./date";

export interface ElapsedTimerInput {
  stored: unknown;
  running: boolean;
  started: unknown;
}

export function expectedSeconds(minutes: unknown): number {
  return Math.max(0, Number(minutes) || 0) * 60;
}

export function elapsedSeconds(input: ElapsedTimerInput, now = Date.now()): number {
  const stored = Math.max(0, Number(input.stored) || 0);
  const started = input.running ? parseTimestamp(input.started) : null;
  return stored + (started ? Math.max(0, Math.floor((now - started.getTime()) / 1000)) : 0);
}

export function formatDuration(seconds: number): string {
  const value = Math.max(0, Math.floor(Math.abs(seconds)));
  const sign = seconds < 0 ? "-" : "";
  const hours = String(Math.floor(value / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((value % 3600) / 60)).padStart(2, "0");
  const remainingSeconds = String(value % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}:${remainingSeconds}`;
}
