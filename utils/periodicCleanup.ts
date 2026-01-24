import { cleanupOrphanedFiles } from "./imageValidation";

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicCleanup(
  intervalMs: number = 24 * 60 * 60 * 1000
): void {
  if (cleanupInterval) clearInterval(cleanupInterval);
  cleanupOrphanedFiles().catch(() => {});
  cleanupInterval = setInterval(() => {
    cleanupOrphanedFiles().catch(() => {});
  }, intervalMs);
}

export function stopPeriodicCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("[PeriodicCleanup] Stopped");
  }
}
