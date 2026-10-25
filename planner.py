from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta


@dataclass
class Task:
    name: str
    duration_hour: float
    deadline: datetime
    priority: int


@dataclass
class TimeSlot:
    start: datetime
    end: datetime
    task: Optional[Task] = None
    unavailable: bool = False


class WeeklyPlanner:
    def __init__(self, week_start: datetime):
        self.week_start = week_start
        self.time_slots: List[TimeSlot] = []
        day = week_start
        for _ in range(7):
            h = 9
            while h < 22:
                s = day + timedelta(hours=h)
                e = day + timedelta(hours=h + 1)
                self.time_slots.append(TimeSlot(start=s, end=e))
                h += 1
            day += timedelta(days=1)

    # weekday_idx: 1=本周第1天（今天），2=第2天 ...7=第7天
    def add_busy_by_day_index(self, day_idx: int, start_hm: str, end_hm: str):
        sh, sm = map(int, start_hm.split(":"))
        eh, em = map(int, end_hm.split(":"))
        busy_start = self.week_start + timedelta(days=day_idx - 1, hours=sh, minutes=sm)
        busy_end = self.week_start + timedelta(days=day_idx - 1, hours=eh, minutes=em)
        for slot in self.time_slots:
            if not (slot.end <= busy_start or slot.start >= busy_end):
                slot.unavailable = True

    def schedule(self, tasks: List[Task]):
        sorted_tasks = sorted(tasks, key=lambda x: (x.priority, x.deadline))
        for t in sorted_tasks:
            remain = t.duration_hour
            for slot in self.time_slots:
                if remain <= 0:
                    break
                if slot.task is not None:
                    continue
                if slot.unavailable:
                    continue
                if slot.end > t.deadline:
                    continue
                slot.task = t
                remain -= 1

    def show(self):
        print("\n===== Weekly Schedule =====")
        for s in self.time_slots:
            if s.unavailable:
                text = "[Busy / Unavailable]"
            elif s.task:
                text = s.task.name
            else:
                text = "[Free]"
            print(f"{s.start.strftime('%a %Y-%m-%d %H:%M')} ~ {s.end.strftime('%H:%M')} | {text}")