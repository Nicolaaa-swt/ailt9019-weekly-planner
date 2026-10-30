import { overlaps, type CalendarEntry } from "./calendar-events.ts";
import { parseChatCalendar, type ChatCalendar } from "./chat-calendar.ts";
import { scheduleTasks, validDate, type TaskRequest } from "./task-scheduler.ts";

const text = { type: "string" };
const date = { type: "string", description: "Hong Kong date, YYYY-MM-DD." };
const time = { type: "string", description: "Hong Kong HH:mm in 30-minute increments, 09:00–22:00." };
const entryFields = { title: text, date, startTime: time, endTime: time };
function tool(name: string, description: string, properties: object, required: string[]) {
  return { type: "function", function: { name, description, parameters: { type: "object", properties, required, additionalProperties: false } } };
}
export const calendarTools = [
  tool("help", "Explain the planning assistant's capabilities and available tools. Call this when users ask for help, what you can do, how to use the assistant, or which tools you have. Summarize the returned capabilities, tool names, and limitations in the user's language using plain text. This tool never changes the calendar.", {}, []),
  tool("get_calendar", "Read the latest saved calendar before any edit. Inspect occupied times, weekly recurring classes, task IDs and deadlines. Use the fresh system snapshot and this result to choose non-overlapping times. Call again after a stale-calendar error.", {}, []),
  tool("create_entry", "Create one task block or weekly recurring class at explicit free times. First call get_calendar and check overlaps, including future recurring classes. Classes repeat weekly from date with no end date. Ask if the intended date/time or recurrence is unclear. Use schedule_tasks for tasks needing automatic placement.", { ...entryFields, kind: { type: "string", enum: ["task", "class"] } }, ["title", "kind", "date", "startTime", "endTime"]),
  tool("update_entry", "Edit an existing entry by its exact ID after reading get_calendar and checking overlaps. Supply only changed fields. A class edit changes the entire weekly series from its start date, not one occurrence; ask if scope is unclear. A task edit affects only this block, not all blocks sharing requestId. Preserve the length of scheduled task blocks and respect their deadline.", { id: text, ...entryFields }, ["id"]),
  tool("delete_entry", "Delete the entry with this exact ID after reading get_calendar. Deleting a class removes its whole weekly series; deleting a task removes only this block. Ask if the target or scope is ambiguous. Never delete entries merely to resolve a conflict unless the user requested deletion.", { id: text }, ["id"]),
  tool("schedule_tasks", "Read get_calendar first, then schedule new tasks into free slots in the displayed week, by priority then deadline. Default priority to 1 unless the user explicitly specifies otherwise; do not ask for an omitted priority. Existing entries remain in place. Tasks can split across days. Report any unscheduled hours from the result; never claim partial scheduling is complete. Do not use this tool to reschedule existing tasks or create duplicates.", { tasks: { type: "array", minItems: 1, maxItems: 20, items: { type: "object", additionalProperties: false, properties: { title: text, durationHours: { type: "number", minimum: 0.5, multipleOf: 0.5 }, deadline: { type: "string", description: "Hong Kong YYYY-MM-DDTHH:mm" }, priority: { type: "integer", minimum: 1, default: 1, description: "Defaults to 1 unless the user explicitly specifies another priority." } }, required: ["title", "durationHours", "deadline"] } } }, ["tasks"]),
];
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ToolStep = { assistant: { role: "assistant"; content: string | null; reasoning_content?: string; tool_calls: ToolCall[] }; results: { role: "tool"; tool_call_id: string; content: string }[] };
export function validSteps(value: unknown): value is ToolStep[] {
  if (!Array.isArray(value) || value.length > 12 || JSON.stringify(value).length > 600_000) return false;
  const ids = new Set<string>();
  return value.every(step => {
    const a = step?.assistant;
    if (!a || a.role !== "assistant" || !(a.content === null || typeof a.content === "string") ||
      !(a.reasoning_content === undefined || typeof a.reasoning_content === "string") || !Array.isArray(a.tool_calls) || a.tool_calls.length !== 1 || !Array.isArray(step.results) || step.results.length !== 1) return false;
    const c = a.tool_calls[0], r = step.results[0];
    if (!c || typeof c.id !== "string" || ids.has(c.id) || c.type !== "function" || !calendarTools.some(t => t.function.name === c.function?.name) || typeof c.function?.arguments !== "string" || c.function.arguments.length > 20_000 || r?.role !== "tool" || r.tool_call_id !== c.id || typeof r.content !== "string") return false;
    ids.add(c.id);
    return true;
  });
}
function slot(value: unknown) {
  if (typeof value !== "string" || !/^(\d{2}):(00|30)$/.test(value)) throw new Error("Invalid time; use 30-minute increments between 09:00 and 22:00.");
  const result = (Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) - 540) / 30;
  if (result < 0 || result > 26) throw new Error("Time outside planner hours.");
  return result;
}
export function executeCalendarTool(calendar: ChatCalendar, call: ToolCall): { calendar: ChatCalendar; result: object; changed: boolean } {
  const args = JSON.parse(call.function.arguments);
  if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Invalid arguments.");
  const spec = calendarTools.find(t => t.function.name === call.function.name);
  if (!spec || Object.keys(args).some(key => !Object.hasOwn(spec.function.parameters.properties, key)) || spec.function.parameters.required.some(key => !Object.hasOwn(args, key))) throw new Error("Invalid tool or fields.");
  if (call.function.name === "help") return {
    calendar, changed: false, result: {
      success: true,
      capabilities: ["Explain the current calendar and find free time", "Create tasks and weekly recurring classes", "Move or rename entries", "Delete task blocks or class series", "Automatically schedule new tasks by deadline and priority"],
      tools: calendarTools.map(tool => ({ name: tool.function.name, description: tool.function.description, parameters: tool.function.parameters })),
      limitations: ["Planning-related requests only", "Calendar times are Hong Kong time, 09:00–22:00 in 30-minute increments", "Read the latest calendar before editing; overlaps and stale edits are rejected", "New tasks default to priority 1 unless specified", "Class changes affect the whole weekly series; individual class exceptions are not supported", "Task updates affect one block; scheduled block duration must be preserved", "Scheduling may be partial when free time is insufficient", "Data is saved in this browser, without account or cross-device syncing", "No undo tool is available; stopping a response does not undo saved edits"],
      examples: ["What is on my calendar today?", "Add a task tomorrow from 14:00 to 15:00", "Schedule two hours for my essay before Friday at 18:00", "Move my task to a free slot", "Which tools do you have?"],
    },
  };
  if (call.function.name === "get_calendar") return { calendar, changed: false, result: { success: true, calendar } };
  let entries = [...calendar.entries];
  let result: object;
  if (call.function.name === "schedule_tasks") {
    if (!Array.isArray(args.tasks) || !args.tasks.length || args.tasks.length > 20) throw new Error("Provide 1–20 tasks.");
    const tasks: TaskRequest[] = args.tasks.map((task: Record<string, unknown>) => {
      if (!task || typeof task.title !== "string" || typeof task.deadline !== "string" || typeof task.durationHours !== "number" || (task.priority !== undefined && typeof task.priority !== "number")) throw new Error("Invalid task fields.");
      return { id: crypto.randomUUID(), title: task.title, deadline: task.deadline, durationHours: task.durationHours, priority: task.priority === undefined ? 1 : task.priority as number };
    });
    const scheduled = scheduleTasks(calendar.weekStart, tasks, entries);
    entries.push(...scheduled.entries);
    result = { success: true, report: scheduled.report };
  } else if (call.function.name === "delete_entry") {
    if (typeof args.id !== "string" || !entries.some(e => e.id === args.id)) throw new Error("Entry ID not found. Read the calendar again.");
    entries = entries.filter(e => e.id !== args.id);
    result = { success: true, deletedId: args.id };
  } else {
    const existing = entries.find(e => e.id === args.id);
    if (call.function.name === "update_entry" && !existing) throw new Error("Entry ID not found. Read the calendar again.");
    if (call.function.name === "update_entry" && Object.keys(args).length < 2) throw new Error("No changes supplied.");
    const entry: CalendarEntry = existing ? { ...existing } : { id: crypto.randomUUID(), kind: args.kind, title: "", date: "", start: 0, end: 0 };
    if (args.title !== undefined) { if (typeof args.title !== "string") throw new Error("Invalid title."); entry.title = args.title.trim(); }
    if (args.date !== undefined) { if (typeof args.date !== "string" || !validDate(args.date)) throw new Error("Invalid date."); entry.date = args.date; }
    if (args.startTime !== undefined) entry.start = slot(args.startTime);
    if (args.endTime !== undefined) entry.end = slot(args.endTime);
    if (!entry.title || entry.title.length > 120 || entry.end <= entry.start) throw new Error("Invalid title or time range.");
    if (existing?.task && entry.end - entry.start !== existing.end - existing.start) throw new Error("Preserve the duration of a scheduled task block.");
    if (entry.task && `${entry.date}T${String(9 + Math.floor(entry.end / 2)).padStart(2, "0")}:${entry.end % 2 ? "30" : "00"}` > entry.task.deadline) throw new Error("Task would end after its deadline.");
    if (overlaps(entries, entry)) throw new Error("Overlap rejected. Inspect the calendar and choose free times, including recurring classes.");
    entries = [...entries.filter(e => e.id !== entry.id), entry];
    result = { success: true, entry };
  }
  const next = parseChatCalendar({ ...calendar, entries });
  return { calendar: next, changed: JSON.stringify(next.entries) !== JSON.stringify(calendar.entries), result };
}

/** Validate against the latest browser storage and commit without yielding between check and write. */
export function executeStoredCalendarTool(storage: Pick<Storage, "getItem" | "setItem">, expected: ChatCalendar, call: ToolCall, checked: boolean) {
  const latest = parseChatCalendar({ ...expected, entries: JSON.parse(storage.getItem("weekspace-entries") || "[]") });
  if (call.function.name !== "get_calendar" && call.function.name !== "help") {
    if (!checked) throw new Error("Read get_calendar before editing.");
    if (JSON.stringify(latest.entries) !== JSON.stringify(expected.entries)) throw new Error("Calendar changed while thinking. Read get_calendar and check conflicts again.");
  }
  const executed = executeCalendarTool(latest, call);
  if (executed.changed) storage.setItem("weekspace-entries", JSON.stringify(executed.calendar.entries));
  return executed;
}
