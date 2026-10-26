# Weekly Task Planner - Group 6

A weekly task planner for AILT9019 with a Python command-line interface and a Next.js web calendar. Both use deterministic, rule-based scheduling: tasks are ordered by priority and deadline, then assigned to available 30-minute time slots.

## Features

- Enter fixed busy periods such as classes.
- Enter tasks with a name, duration, deadline, and priority.
- Schedule tasks in 30-minute blocks between 09:00 and 22:00.
- Report tasks that cannot be fully scheduled before their deadlines.
- Choose either an English or Chinese interface.
- View schedules as a weekly terminal grid.
- Save one schedule for each calendar week and reopen it later.
- Use the web calendar to add and edit events, repeat classes weekly, and schedule batches of tasks.
- Switch the web interface between English, Traditional Chinese, and Simplified Chinese, with light and dark themes.

## Requirements

- CLI: Python 3.9 or later; no external Python packages are required.
- Web: Node.js 20.9 or later and npm; a Python backend is not required.

## How to run (Web)

Requires Node.js 20.9 or later and npm.

From the repository root, install the web app's dependencies and start the
development server:

```bash
cd planner-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. If that port
is already in use, use the local URL printed in the terminal. Press Ctrl+C to
stop the server.

To build and run the production version, run these commands inside `planner-web`:

```bash
npm run build
npm start
```

The web app runs its scheduler in the browser; no Python backend is required.
Tasks, classes, and preferences are saved in the browser's localStorage.

## How to run (CLI)

Clone or download the repository, open a terminal in the project folder, and run:

```bash
python3 main.py
```

On the first run, choose Chinese or English. If the current week does not have a saved schedule, the program asks for busy periods and tasks before displaying the menu.

The menu allows you to:

1. View the saved schedule
2. Create and replace the current week's schedule
3. Change the interface language
4. Quit

Task durations must be positive and use 0.5-hour increments. Days are numbered from 1 (Monday) to 7 (Sunday). Busy periods must be within 09:00-22:00. Invalid input prompts the user to try again.

Schedules are stored as UTF-8 text files in `schedules/YYYY-MM-DD.txt`, using the Monday date of that week. Language preference is stored in `language.txt`. These generated files are ignored by Git.

## Reproducible example

The following example uses the English interface and creates one busy period and one task during the week beginning Monday, 26 October 2026.

Example input:

```text
Language: English
Busy periods: 1
Day number: 1
Start time: 10:00
End time: 11:00
Tasks: 1
Task name: Write report
Duration: 1.0
Deadline date: 2026-10-30
Deadline time: 12:00
Priority: 1
```

Expected result:

- `Write report` is assigned to two 30-minute slots.
- Monday 10:00-11:00 is marked as busy.
- The program prints a seven-day timetable covering 09:00-22:00.
- No unscheduled-task warning appears because the task fits before its deadline.

Relevant rows from the expected timetable:

```text
| 09:00-09:30 | Write report | Free | Free | Free | Free | Free | Free |
| 09:30-10:00 | Write report | Free | Free | Free | Free | Free | Free |
| 10:00-10:30 | Busy         | Free | Free | Free | Free | Free | Free |
| 10:30-11:00 | Busy         | Free | Free | Free | Free | Free | Free |
```

Complete sample timetable outputs are available in [`sample_schedule.txt`](sample_schedule.txt) and [`sample_schedule_chinese.txt`](sample_schedule_chinese.txt).

## How to check the result

Run the CLI tests from the project folder:

```bash
python3 -m unittest -v
```

The CLI test suite contains 12 tests covering:

- Calendar-week calculation and saved schedules
- English and Chinese menu behaviour
- Safe replacement of saved schedules
- 30-minute slot generation
- Busy-period overlap
- Fractional task durations
- Unscheduled-task reporting
- Invalid input handling
- English and Chinese grid alignment

Verified result for the current repository version:

```text
Ran 12 tests
OK
```

For the web app, run the type check, 13 calendar and scheduler tests, and production build:

```bash
cd planner-web
npx tsc --noEmit
node app/calendar-events.test.mjs
node app/task-scheduler.test.mjs
npm run build
```

The direct TypeScript test commands require a Node.js version that supports importing TypeScript source directly; they are verified with Node.js 26.

## Known limitations

- The scheduling algorithm is greedy. It assigns the earliest available slots by priority and deadline, but it does not optimise for user preferences or keep every task in one continuous block.
- The planner schedules across the complete Monday-Sunday calendar week and does not exclude time slots earlier than the current time.
- CLI schedules are local text files; web events and preferences use browser localStorage. There is no cloud synchronisation or multi-user editing.
- Web batch scheduling fills free slots in the displayed week and preserves existing calendar entries rather than rescheduling them.

## Project files

- `main.py` - menu, language preference, and saved-schedule management
- `main_english.py` - English schedule input workflow
- `main_chinese.py` - Chinese schedule input workflow
- `planner.py` - task, time-slot, validation, and scheduling logic
- `schedule_grid.py` - terminal timetable rendering
- `test_planner.py` - scheduler tests
- `test_menu.py` - menu and persistence tests
- `test_schedule_grid.py` - timetable rendering tests
- `planner-web/` - Next.js web calendar, browser scheduler, and web tests
