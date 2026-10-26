# Weekspace web planner

Run `npm run dev` in this directory, then open http://localhost:3000.

The calendar uses Monday–Sunday weeks and 30-minute slots between 09:00 and
22:00, in Hong Kong time. Classes repeat weekly from their start date. Select
Tasks or Classes to add entries by dragging or edit that type of entry.

The **+ Tasks** button to the left of the toggle accepts one or more task names,
required durations (positive 0.5-hour increments), deadline dates/times, and
priorities (1 is highest). Scheduling runs in the browser using the Python CLI's
greedy rules: priority first, then deadline, then the earliest available slots
in the displayed week. Tasks can split around classes and across days. Existing
calendar entries are retained as occupied time; adding a batch does not move or
replan earlier entries.

The result shows scheduled and remaining hours for every submitted task, plus
reasons when a task does not fit. The result is shown immediately after scheduling. Entries and reports are stored in this browser's localStorage;
there is no Python server, account sync, or shared storage.

The app supports English, Traditional Chinese, and Simplified Chinese.
Task-name suggestions use saved class names and the CLI sample tasks.

## Checks

```bash
npx tsc --noEmit
node app/calendar-events.test.mjs
node app/task-scheduler.test.mjs
```

The Node test commands require a Node version that supports importing TypeScript
source directly (the development environment uses Node 26).
