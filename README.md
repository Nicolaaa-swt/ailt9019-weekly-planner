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

Task durations must be positive and use 0.5-hour increments. Days are numbered
from 1 (today) to 7. Busy periods must fall within 09:00-22:00.

## Run the tests

```bash
python3 -m unittest -v
```
