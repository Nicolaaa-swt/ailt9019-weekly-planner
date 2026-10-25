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
    SLOT_MINUTES = 30

    def __init__(self, week_start: datetime):
        # Use a date-only anchor so every day begins at 09:00, regardless of
        # the time included in week_start.
        self.week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        self.time_slots: List[TimeSlot] = []
        self.unscheduled_tasks: List[tuple[Task, float]] = []
        self.unscheduled_reports: List[dict] = []
        for day_idx in range(7):
            day_start = self.week_start + timedelta(days=day_idx, hours=9)
            for slot_idx in range(13 * 60 // self.SLOT_MINUTES):
                s = day_start + timedelta(minutes=slot_idx * self.SLOT_MINUTES)
                e = s + timedelta(minutes=self.SLOT_MINUTES)
                self.time_slots.append(TimeSlot(start=s, end=e))

    # weekday_idx: 1=本周第1天（今天），2=第2天 ...7=第7天
    def add_busy_by_day_index(self, day_idx: int, start_hm: str, end_hm: str):
        if not 1 <= day_idx <= 7:
            raise ValueError("day_idx must be between 1 and 7")

        try:
            sh, sm = map(int, start_hm.split(":"))
            eh, em = map(int, end_hm.split(":"))
        except ValueError as exc:
            raise ValueError("times must use HH:MM format") from exc

        if not (0 <= sh <= 23 and 0 <= eh <= 23 and 0 <= sm <= 59 and 0 <= em <= 59):
            raise ValueError("times must be valid 24-hour times")

        busy_start = self.week_start + timedelta(days=day_idx - 1, hours=sh, minutes=sm)
        busy_end = self.week_start + timedelta(days=day_idx - 1, hours=eh, minutes=em)
        working_start = self.week_start + timedelta(days=day_idx - 1, hours=9)
        working_end = self.week_start + timedelta(days=day_idx - 1, hours=22)
        if busy_start >= busy_end:
            raise ValueError("busy time must end after it starts")
        if busy_start < working_start or busy_end > working_end:
            raise ValueError("busy time must be within 09:00-22:00")

        for slot in self.time_slots:
            if not (slot.end <= busy_start or slot.start >= busy_end):
                slot.unavailable = True

    def schedule(self, tasks: List[Task]):
        for slot in self.time_slots:
            slot.task = None
        self.unscheduled_tasks = []
        self.unscheduled_reports = []

        for task in tasks:
            if task.duration_hour <= 0:
                raise ValueError(f"task '{task.name}' must have a positive duration")
            slot_count = task.duration_hour * 60 / self.SLOT_MINUTES
            if not slot_count.is_integer():
                raise ValueError(
                    f"task '{task.name}' duration must be in {self.SLOT_MINUTES}-minute increments"
                )

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
                remain -= self.SLOT_MINUTES / 60
            if remain > 0:
                self.unscheduled_tasks.append((t, remain))
                if any(slot.unavailable for slot in self.time_slots if slot.end <= t.deadline):
                    reason = "截止前没有足够可用时间（含固定事务占用）"
                else:
                    reason = "截止时间太近或总空闲时间不足"
                self.unscheduled_reports.append(
                    {"task": t, "remaining_hour": remain, "reason": reason}
                )

        return self.unscheduled_tasks

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

        if self.unscheduled_reports:
            print("\n===== ⚠️ 不可行性报告 =====")
            for report in self.unscheduled_reports:
                task = report["task"]
                hours = report["remaining_hour"]
                print(
                    f"⚠️ {task.name}: {hours:g} hour(s) could not be scheduled "
                    f"before the deadline（原因：{report['reason']}）"
                )
