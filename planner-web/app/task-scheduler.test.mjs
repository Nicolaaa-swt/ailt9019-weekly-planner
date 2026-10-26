import test from "node:test";
import assert from "node:assert/strict";
import { scheduleTasks, validTask, readScheduleReports } from "./task-scheduler.ts";
import { overlaps } from "./calendar-events.ts";

const week = "2026-10-26";
const task = (id, changes = {}) => ({ id, title: id, durationHours: 1, deadline: "2026-11-01T23:59", priority: 1, ...changes });
const event = (id, changes = {}) => ({ id, title: id, kind: "class", date: week, start: 0, end: 2, ...changes });

test("priority takes precedence, then deadline, with stable input order for ties", () => {
  const result = scheduleTasks(week, [task("low", { priority: 2 }), task("late"), task("early", { deadline: `${week}T11:00` }), task("tie")], []);
  assert.deepEqual(result.report.outcomes.map(item => item.id), ["early", "late", "tie", "low"]);
  assert.deepEqual(result.entries.map(item => [item.title, item.start, item.end]), [["early", 0, 2], ["late", 2, 4], ["tie", 4, 6], ["low", 6, 8]]);
});
test("splits tasks around recurring classes and existing tasks, retaining input data", () => {
  const existing = [event("course", { date: "2026-10-19", start: 1, end: 3 }), event("manual", { kind: "task", start: 4, end: 5 })];
  const before = JSON.stringify(existing);
  const result = scheduleTasks(week, [task("study", { durationHours: 2 })], existing);
  assert.deepEqual(result.entries.map(item => [item.start, item.end]), [[0, 1], [3, 4], [5, 7]]);
  assert.equal(JSON.stringify(existing), before);
  assert.equal(result.entries.some(item => overlaps(existing, item)), false);
  assert.equal(result.entries[0].task.durationHours, 2);
});
test("half-hour must finish by deadline and unavailable hours are reported", () => {
  const result = scheduleTasks(week, [task("study", { durationHours: 2, deadline: `${week}T10:00` })], []);
  assert.deepEqual(result.entries.map(item => [item.start, item.end]), [[0, 2]]);
  assert.equal(result.report.outcomes[0].remainingHours, 1);
  assert.equal(result.report.outcomes[0].scheduledHours, 1);
  const early = scheduleTasks(week, [task("early", { deadline: `${week}T09:29` })], []);
  assert.equal(early.entries.length, 0);
  assert.equal(early.report.outcomes[0].remainingHours, 1);
  assert.equal(early.report.outcomes[0].reason, "deadline");
});
test("splits across days but never leaves the displayed Monday–Sunday week", () => {
  const result = scheduleTasks(week, [task("large", { durationHours: 100 })], []);
  assert.equal(result.entries.length, 7);
  assert.equal(result.entries[0].date, week);
  assert.equal(result.entries.at(-1).date, "2026-11-01");
  assert.equal(result.report.outcomes[0].scheduledHours, 91);
  assert.equal(result.report.outcomes[0].remainingHours, 9);
  assert.equal(result.entries.every(item => item.start === 0 && item.end === 26), true);
});
test("week and deadline logic works across years", () => {
  const result = scheduleTasks("2026-12-28", [task("year", { durationHours: 91, deadline: "2027-01-03T22:00" })], []);
  assert.equal(result.entries.at(-1).date, "2027-01-03");
  assert.equal(result.report.outcomes[0].remainingHours, 0);
});
test("validates half-hour durations, positive priorities, and actual calendar dates", () => {
  assert.equal(validTask(task("valid", { durationHours: 0.5 })), true);
  for (const changes of [{ durationHours: 0 }, { durationHours: 0.25 }, { durationHours: Infinity }, { priority: 0 }, { priority: 1.5 }, { deadline: "2026-02-30T10:00" }, { deadline: "2026-10-26T24:00" }, { title: " " }]) {
    assert.equal(validTask(task("invalid", changes)), false);
    assert.throws(() => scheduleTasks(week, [task("invalid", changes)], []));
  }
  assert.throws(() => scheduleTasks(week, [task("same"), task("same")], []));
});
test("persisted reports preserve unscheduled requests and reject malformed storage", () => {
  const result = scheduleTasks(week, [task("large", { durationHours: 100 })], []);
  assert.deepEqual(readScheduleReports(JSON.stringify({ [week]: result.report })), { [week]: result.report });
  assert.deepEqual(readScheduleReports("broken"), {});
  assert.deepEqual(readScheduleReports(JSON.stringify({ [week]: { weekStart: week, outcomes: [null] } })), {});
});
