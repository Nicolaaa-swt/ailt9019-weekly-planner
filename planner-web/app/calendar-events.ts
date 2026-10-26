export type EntryKind = "task" | "class";
export type CalendarEntry = { id: string; kind: EntryKind; title: string; date: string; start: number; end: number;
  task?: { requestId: string; durationHours: number; deadline: string; priority: number };
};
export const TOTAL_SLOTS = 26;
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function slotTime(slot: number) {
  const minutes = 9 * 60 + slot * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
function weekday(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}
export function occursOn(entry: CalendarEntry, date: string) {
  return entry.kind === "class"
    ? date >= entry.date && weekday(entry.date) === weekday(date)
    : entry.date === date;
}
export function overlaps(entries: CalendarEntry[], entry: CalendarEntry) {
  return entries.some(other => {
    if (other.id === entry.id || entry.start >= other.end || entry.end <= other.start) return false;
    if (entry.kind === "class" && other.kind === "class") return weekday(entry.date) === weekday(other.date);
    return entry.kind === "class" ? occursOn(entry, other.date) : occursOn(other, entry.date);
  });
}
export function readEntries(raw: string): CalendarEntry[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is CalendarEntry => entry && typeof entry.id === "string" && (entry.kind === "task" || entry.kind === "class") && typeof entry.title === "string" && typeof entry.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && Number.isInteger(entry.start) && Number.isInteger(entry.end) && entry.start >= 0 && entry.end <= TOTAL_SLOTS && entry.end > entry.start);
  } catch { return []; }
}
