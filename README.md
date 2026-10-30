# Weekly Task Planner - Group 6

A weekly task planner for AILT9019, with a Next.js web calendar as the main interface. Tasks are ordered by priority and deadline, then assigned to available 30-minute time slots using deterministic, rule-based scheduling.

## Web app

### Features

- Add and edit events, repeat classes weekly, and schedule batches of tasks.
- Enter tasks with a name, duration, deadline, and priority.
- Schedule tasks in 30-minute blocks between 09:00 and 22:00.
- Report tasks that cannot be fully scheduled before their deadlines.
- Switch between English, Traditional Chinese, and Simplified Chinese.
- Choose light and dark themes.
- Use AI chat to organize your week, manage calendar entries, and automatically schedule tasks.

### Requirements

Node.js 20.9 or later and npm.

### AI chat setup

Before starting the web app, copy the example environment file from the repository root:

```bash
cp planner-web/.env.example planner-web/.env
```

If you already have `planner-web/.env`, edit that file instead of replacing it.

Open `planner-web/.env` and set `API_KEY` to your AI provider's API key. The example leaves this value blank. `AI_BASE_URL` defaults to the Alibaba Cloud compatible API endpoint shown in the example; change it if your provider uses another compatible endpoint. The endpoint must support the app's `deepseek-v4.1-flash` model and tool calls.

Keep your API key in the local `.env` file, which Git ignores. Restart the development server after changing environment variables. AI chat requires this configuration; the calendar and manual scheduling can be used without it.

### How to run

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

The web app runs its scheduler in the browser.
Tasks, classes, and preferences are saved in the browser's localStorage.

### Included agent and tool calls

The built-in planning agent uses `deepseek-v4.1-flash` to help organize your week through AI chat. It answers planning questions in your language and can act on requests to manage tasks and classes. Each request includes the displayed week and saved calendar entries, with dates and times interpreted in Hong Kong time.

The agent has six tools:

| Tool | What it does |
| --- | --- |
| `help` | Explains the agent's capabilities, available tools, and usage. |
| `get_calendar` | Reads the latest saved calendar, including tasks and recurring classes. |
| `create_entry` | Adds a task block or weekly recurring class at a specified date and time. |
| `update_entry` | Changes an entry's title, date, or time using its ID. Task edits affect one block; class edits affect the weekly series. |
| `delete_entry` | Removes a task block or an entire recurring class series using its ID. |
| `schedule_tasks` | Automatically places new tasks into free slots in the displayed week, ordered by priority and deadline, and reports any hours that could not be scheduled. Priority defaults to 1 when omitted. |

For calendar edits, the agent first calls `get_calendar`, then requests the appropriate action. The browser validates and executes each tool call, saves successful changes to localStorage, and returns the result to the agent for its reply. Edits are checked for overlapping entries and changes made while the agent was thinking. Scheduled task edits preserve the block's duration and respect its deadline.

For example, ask “What is on my calendar today?”, “Add a task tomorrow from 14:00 to 15:00”, or “Schedule two hours for my essay before Friday at 18:00”. You can also as the agent "What do you do?" for a simple explanation of its capabilities and tools.

### Greedy scheduling

The web app uses the same deterministic greedy scheduler for the **+ Tasks** dialog and the agent's `schedule_tasks` tool. “Greedy” means it takes the earliest available slots for each task in turn, without going back to rearrange earlier choices.

1. Sort the submitted tasks by priority (1 is highest), then by earliest deadline. Tasks with equal priority and deadline keep their input order.
2. For each task, scan the displayed Monday–Sunday week in date and time order, using 30-minute slots between 09:00 and 22:00 in Hong Kong time.
3. Skip dates before today and slots that end after the task's deadline. Today's slots are considered from 09:00, even if that time has already passed.
4. Fill free slots while avoiding existing tasks, recurring classes, and tasks already placed from this batch. Consecutive slots are combined into blocks; a task can split around busy periods or across days.
5. Report the scheduled and remaining hours for each task if there is insufficient time before its deadline.

For example, if a two-hour task has the highest priority and a class occupies 10:00–11:00 on the first eligible day, the scheduler can place the task at 09:00–10:00 and 11:00–12:00, provided both blocks finish before its deadline. Lower-priority tasks then use the remaining free slots. Existing calendar entries stay in place.


---

## Python command-line planner

The repository also includes a standalone Python command-line planner with deterministic, rule-based scheduling.

### Features

- Enter fixed busy periods such as classes.
- Enter tasks with a name, duration, deadline, and priority.
- Schedule tasks in 30-minute blocks between 09:00 and 22:00.
- Report tasks that cannot be fully scheduled before their deadlines.
- Choose either an English or Chinese interface.
- View schedules as a weekly terminal grid.
- Save one schedule for each calendar week and reopen it later.

### Requirements

Python 3.9 or later; no external Python packages are required.

### How to run

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

### Test example

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

### How to check the result

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

### Known limitations

- The scheduling algorithm is greedy. It assigns the earliest available slots by priority and deadline, but it does not optimise for user preferences or keep every task in one continuous block.
- The CLI schedules across the complete Monday-Sunday calendar week and does not exclude time slots earlier than the current time.
- CLI schedules are local text files. There is no cloud synchronisation or multi-user editing.

### Project files

- `main.py` - menu, language preference, and saved-schedule management
- `main_english.py` - English schedule input workflow
- `main_chinese.py` - Chinese schedule input workflow
- `planner.py` - task, time-slot, validation, and scheduling logic
- `schedule_grid.py` - terminal timetable rendering
- `test_planner.py` - scheduler tests
- `test_menu.py` - menu and persistence tests
- `test_schedule_grid.py` - timetable rendering tests
