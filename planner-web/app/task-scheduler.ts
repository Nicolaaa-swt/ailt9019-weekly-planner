import { overlaps, slotTime, TOTAL_SLOTS, type CalendarEntry } from "./calendar-events.ts";

export type TaskRequest = { id: string; title: string; durationHours: number; deadline: string; priority: number };
export type TaskOutcome = TaskRequest & { scheduledHours: number; remainingHours: number; reason: "deadline" | "availability" | null };
export type ScheduleReport = { weekStart: string; outcomes: TaskOutcome[] };

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function validTask(task: TaskRequest) {
  const [date, time] = task.deadline.split("T");
  return Boolean(task.id && task.title.trim() && task.title.length <= 120)
    && Number.isFinite(task.durationHours) && task.durationHours > 0 && Number.isSafeInteger(task.durationHours * 2)
    && Number.isSafeInteger(task.priority) && task.priority >= 1
    && validDate(date || "") && /^([01]\d|2[0-3]):[0-5]\d$/.test(time || "") && task.deadline.length === 16;
}

/** The CLI's greedy scheduler: priority, deadline, then earliest free half-hour. */
export function scheduleTasks(weekStart: string, tasks: TaskRequest[], existing: CalendarEntry[]) {
  if (!validDate(weekStart) || tasks.some(task => !validTask(task)) || new Set(tasks.map(task => task.id)).size !== tasks.length) {
    throw new Error("Invalid scheduling input");
  }
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${weekStart}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const occupied = [...existing];
  const generated: CalendarEntry[] = [];
  const outcomes: TaskOutcome[] = [];
  const ordered = [...tasks].sort((a, b) => a.priority - b.priority || a.deadline.localeCompare(b.deadline));
  for (const task of ordered) {
    let remaining = task.durationHours * 2;
    let eligible = 0;
    let previous: CalendarEntry | undefined;
    for (const date of dates) {
      for (let slot = 0; slot < TOTAL_SLOTS && remaining > 0; slot++) {
        // Compare Hong Kong wall-clock values directly, independent of browser timezone.
        if (`${date}T${slotTime(slot + 1)}` > task.deadline) continue;
        eligible++;
        const candidate: CalendarEntry = { id: `${task.id}:${date}:${slot}`, kind: "task", title: task.title.trim(), date, start: slot, end: slot + 1,
          task: { requestId: task.id, durationHours: task.durationHours, deadline: task.deadline, priority: task.priority } };
        if (overlaps(occupied, candidate)) continue;
        if (previous && previous.date === date && previous.end === slot) {
          previous.end = slot + 1;
        } else {
          previous = candidate;
          generated.push(candidate);
          occupied.push(candidate);
        }
        remaining--;
      }
    }
    outcomes.push({ ...task, title: task.title.trim(), scheduledHours: task.durationHours - remaining / 2, remainingHours: remaining / 2,
      reason: remaining ? (eligible ? "availability" : "deadline") : null });
  }
  return { entries: generated, report: { weekStart, outcomes } satisfies ScheduleReport };
}

export function readScheduleReports(raw: string): Record<string, ScheduleReport> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([week, report]) => {
      if (!validDate(week) || !report || typeof report !== "object") return false;
      const value = report as ScheduleReport;
      return value.weekStart === week && Array.isArray(value.outcomes) && value.outcomes.every(task => validTask(task)
        && Number.isFinite(task.scheduledHours) && Number.isFinite(task.remainingHours) && task.scheduledHours >= 0 && task.remainingHours >= 0
        && task.scheduledHours + task.remainingHours === task.durationHours && [null, "deadline", "availability"].includes(task.reason));
    }));
  } catch { return {}; }
}
