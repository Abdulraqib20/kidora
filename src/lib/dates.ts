/** Calculate elapsed calendar days from a given date to now. */
export function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

