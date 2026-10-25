from planner import WeeklyPlanner, Task
from datetime import datetime

if __name__ == "__main__":
    # 自动拿今天，作为七天计划的第一天；具体工作时间由 planner 定义。
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    planner = WeeklyPlanner(today)

    print("===== 任务排班工具 =====")
    print(f"✅ 本周起始：{today.strftime('%a %Y-%m-%d')}，一共7天")
    print("序号说明：1=今天（第1天），2=明天（第2天），3=第3天 ... 7=第7天")

    busy_num = int(input("你要输入几段固定忙碌时间（上课）："))
    for i in range(busy_num):
        print(f"\n--- 第{i+1}段忙碌时间 ---")
        day_idx = int(input("填写是本周第几天（1~7）："))
        st = input("开始时间【HH:MM，例：10:00】：")
        et = input("结束时间【HH:MM，例：12:00】：")
        planner.add_busy_by_day_index(day_idx, st, et)

    task_count = int(input("\n请问你要输入几个任务？"))
    task_list = []
    for i in range(task_count):
        print(f"\n--- 第{i+1}个任务 ---")
        name = input("任务名称：")
        duration = float(input("需要多少小时（以0.5小时为单位）："))
        dl_date = input("截止日期【YYYY-MM-DD，例：2026-10-30】：")
        dl_time = input("截止时间【HH:MM，例：23:59】：")
        priority = int(input("优先级（1最高，数字越大越低）："))
        deadline = datetime.strptime(f"{dl_date} {dl_time}", "%Y-%m-%d %H:%M")
        task_list.append(Task(name=name, duration_hour=duration, deadline=deadline, priority=priority))

    planner.schedule(task_list)
    planner.show()
