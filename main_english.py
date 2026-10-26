from datetime import datetime

from planner import Task, WeeklyPlanner
from main import calendar_week_start, read_value, valid_duration


def main(week_start=None):
    today = week_start or calendar_week_start()
    planner = WeeklyPlanner(today, language="english")

    print("===== Weekly Task Planner =====")
    print(f"Week starts: {today:%a %Y-%m-%d}, covering 7 days")
    print("Days: 1=Monday, 2=Tuesday, ... 7=Sunday")

    busy_count = read_value("How many fixed busy periods (such as classes)? ", valid=lambda n: n >= 0, language="english")
    for i in range(busy_count):
        print(f"\n--- Busy period {i + 1} ---")
        while True:
            try:
                day_index = read_value("Day number (1-7): ", valid=lambda n: 1 <= n <= 7, language="english")
                start = input("Start time (HH:MM, e.g. 10:00): ")
                end = input("End time (HH:MM, e.g. 12:00): ")
                planner.add_busy_by_day_index(day_index, start, end)
                break
            except ValueError:
                print('Invalid busy period. Use day 1-7 and times within 09:00-22:00, with end after start.')

    task_count = read_value("\nHow many tasks? ", valid=lambda n: n >= 0, language="english")
    tasks = []
    for i in range(task_count):
        print(f"\n--- Task {i + 1} ---")
        name = read_value("Task name: ", str, bool, language="english")
        duration = read_value("Duration in hours (0.5-hour increments): ", float, valid_duration, language="english")
        while True:
            try:
                deadline_date = input("Deadline date (YYYY-MM-DD, e.g. 2026-10-30): ")
                deadline_time = input("Deadline time (HH:MM, e.g. 23:59): ")
                priority = read_value("Priority (1=highest; larger numbers=lower): ", valid=lambda n: n >= 1, language="english")
                deadline = datetime.strptime(
                    f"{deadline_date} {deadline_time}", "%Y-%m-%d %H:%M"
                )
                break
            except ValueError:
                print('Invalid date or time. Use YYYY-MM-DD and HH:MM.')
        tasks.append(Task(name, duration, deadline, priority))

    planner.schedule(tasks)
    planner.show()
    return planner


if __name__ == "__main__":
    main()
