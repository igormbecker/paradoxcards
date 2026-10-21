export const IDLE_MS = 24 * 60 * 60 * 1000,
  ABSOLUTE_MS = 7 * IDLE_MS,
  RENEW_MS = 15 * 60 * 1000;
export function sessionWindow(now, absoluteAt = now + ABSOLUTE_MS) {
  return { expiresAt: Math.min(now + IDLE_MS, absoluteAt), absoluteAt };
}
export function renewalNeeded(lastRenewed, now) {
  return now - lastRenewed >= RENEW_MS;
}
export function canRenew(window, now) {
  return now < window.expiresAt && now < window.absoluteAt;
}
