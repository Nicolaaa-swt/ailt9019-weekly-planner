import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, occursOn, overlaps, readEntries, slotTime } from "./calendar-events.ts";

const entry = { id: "a", kind: "task", title: "Study", date: "2026-10-26", start: 2, end: 4 };
test("blocks overlapping classes and tasks while allowing adjacent ranges", () => {
  assert.equal(overlaps([entry], { ...entry, id: "b", kind: "class", start: 3, end: 5 }), true);
  assert.equal(overlaps([entry], { ...entry, id: "b", start: 0, end: 2 }), false);
  assert.equal(overlaps([entry], { ...entry, id: "b", start: 4, end: 6 }), false);
  assert.equal(overlaps([entry], { ...entry, id: "b", date: "2026-10-27" }), false);
});
test("editing an entry excludes its own saved range", () => {
  assert.equal(overlaps([entry], { ...entry, title: "Updated", start: 1, end: 5 }), false);
});
test("invalid stored entries cannot create out-of-hours or negative blocks", () => {
  assert.deepEqual(readEntries("invalid JSON"), []);
  assert.deepEqual(readEntries(JSON.stringify([entry, { ...entry, start: -1 }, { ...entry, end: 27 }, { ...entry, end: 2 }, { ...entry, kind: "other" }, null])), [entry]);
});
test("slot boundaries and calendar date keys follow the planner's 09:00–22:00 range", () => {
  assert.equal(slotTime(0), "09:00");
  assert.equal(slotTime(1), "09:30");
  assert.equal(slotTime(26), "22:00");
  assert.equal(dateKey(new Date(2026, 9, 26, 12)), "2026-10-26");
});

test("classes repeat weekly from their first date across months and years", () => {
  const course = { ...entry, kind: "class" };
  assert.equal(occursOn(course, "2026-10-26"), true);
  assert.equal(occursOn(course, "2026-11-02"), true);
  assert.equal(occursOn(course, "2027-01-04"), true);
  assert.equal(occursOn(course, "2026-11-03"), false);
  assert.equal(occursOn(course, "2026-10-19"), false);
  assert.equal(occursOn(entry, "2026-11-02"), false);
});
test("recurring class conflicts are detected in both directions and future weeks", () => {
  const course = { ...entry, id: "course", kind: "class" };
  const futureTask = { ...entry, date: "2026-11-02" };
  assert.equal(overlaps([course], futureTask), true);
  assert.equal(overlaps([futureTask], course), true);
  assert.equal(overlaps([course], { ...course, id: "other", date: "2027-01-04" }), true);
  assert.equal(overlaps([course], { ...entry, date: "2026-10-19" }), false);
  assert.equal(overlaps([course], { ...futureTask, start: 4, end: 6 }), false);
  assert.equal(overlaps([course], { ...course, date: "2026-11-02" }), false);
});
