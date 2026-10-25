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
        # 以当天 0 点为基准生成 9:00~22:00 的整点格子，避免 hour 重复偏移
        self.week_start = week_start
        self.time_slots: List[TimeSlot] = []
        day0 = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        for i in range(7):
            day = day0 + timedelta(days=i)
            for h in range(9, 22):
                s = day + timedelta(hours=h)
                e = day + timedelta(hours=h + 1)
                self.time_slots.append(TimeSlot(start=s, end=e))

    # weekday_idx: 1=本周第1天（今天），2=第2天 ...7=第7天
    def add_busy_by_day_index(self, day_idx: int, start_hm: str, end_hm: str):
        sh, sm = map(int, start_hm.split(":"))
        eh, em = map(int, end_hm.split(":"))
        day0 = self.week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        busy_start = day0 + timedelta(days=day_idx - 1, hours=sh, minutes=sm)
        busy_end = day0 + timedelta(days=day_idx - 1, hours=eh, minutes=em)
        for slot in self.time_slots:
            if not (slot.end <= busy_start or slot.start >= busy_end):
                slot.unavailable = True

    def schedule(self, tasks: List[Task]) -> List[dict]:
        """返回未能完整排下的任务及原因（不可行性报告）"""
        unfit: List[dict] = []
        sorted_tasks = sorted(tasks, key=lambda x: (x.priority, x.deadline))
        for t in sorted_tasks:
            remain = t.duration_hour
            for slot in self.time_slots:
                if remain <= 0:
                    break
                if slot.task is not None or slot.unavailable:
                    continue
                if slot.end > t.deadline:
                    continue
                slot.task = t
                remain -= 1
            if remain > 0:
                if all(slot.unavailable for slot in self.time_slots
                       if slot.end <= t.deadline and not slot.task):
                    reason = "截止前没有足够可用时间（含固定事务占用）"
                else:
                    reason = "截止时间太近或总空闲时间不足"
                unfit.append({"task": t, "remaining_hour": remain, "reason": reason})
        return unfit

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