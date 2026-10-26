# ailt9019-weekly-planner

# Weekly Task Planner - Group 6

This is a rule-based weekly task scheduler for AILT9019.
No LLM used.

## Features

1. Input tasks with name, duration, deadline, priority
2. Record fixed busy periods such as classes
3. Greedy scheduling by priority, then deadline
4. Schedule in 30-minute blocks between 09:00 and 22:00
5. Warn when a task cannot be completed before its deadline

## How to run

Requires Python 3.9 or later.

```bash
python3 main.py
```

At startup, the program reads `language.txt`, or asks you to choose Chinese or
English if no valid preference is saved. It uses the current calendar week,
Monday through Sunday.

If this week has no saved schedule, schedule creation runs first in your chosen
language. After saving, the numbered menu offers:

1. View schedule — print the saved grid and any unfinished-task report
2. New schedule — create and replace this week's schedule without confirmation
3. Change language — save the preference and immediately switch the menu language
4. Quit

Schedules are saved as UTF-8 text in `schedules/YYYY-MM-DD.txt`, named after the
week's Monday. Older weeks are retained. Saved grids keep the language in which
they were created. A new schedule replaces the existing file only after all input
and rendering finish; Ctrl+C during input preserves the previous schedule.

Task durations must be positive and use 0.5-hour increments. Days are numbered
from 1 (Monday) to 7 (Sunday). Busy periods must fall within 09:00-22:00.
Invalid input prompts you to try again.

`main.py` manages the menu and saved schedules. `main_chinese.py` and
`main_english.py` collect schedule input in their respective languages. Running
either language file directly prints a schedule without saving it; use `main.py`
for the complete program.

## Run the tests

```bash
python3 -m unittest -v
```
