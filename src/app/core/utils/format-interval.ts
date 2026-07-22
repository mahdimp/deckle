/** Formats the time between `now` and a future due date as a short human label (e.g. "10m", "3d", "2mo"). */
export function formatInterval(due: Date, now: Date = new Date()): string {
  const minutes = (due.getTime() - now.getTime()) / 60_000;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;

  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;

  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;

  const months = days / 30;
  if (months < 12) return `${Math.round(months)}mo`;

  return `${(days / 365).toFixed(1)}y`;
}
