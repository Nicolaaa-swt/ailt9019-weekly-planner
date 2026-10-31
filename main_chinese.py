from planner import WeeklyPlanner, Task
from main import calendar_week_start, read_value, valid_duration
from input_validation import parse_date_time


def main(week_start=None):
    today = week_start or calendar_week_start()
    planner = WeeklyPlanner(today)

    print("===== 任务排班工具 =====")
    print(f"✅ 本周起始：{today.strftime('%a %Y-%m-%d')}，一共7天")
    print("序号说明：1=周一，2=周二，3=周三 ... 7=周日")

    busy_num = read_value("你要输入几段固定忙碌时间（上课）：", valid=lambda n: n >= 0, language="chinese")
    for i in range(busy_num):
        print(f"\n--- 第{i+1}段忙碌时间 ---")
        while True:
            try:
                day_idx = read_value("填写是本周第几天（1~7）：", valid=lambda n: 1 <= n <= 7, language="chinese")
                st = input("开始时间【HH:MM，例：10:00】：")
                et = input("结束时间【HH:MM，例：12:00】：")
                planner.add_busy_by_day_index(day_idx, st, et)
                break
            except ValueError:
                print('忙碌时间无效：请选择1至7天及09:00至22:00内的时间，结束须晚于开始。')

    task_count = read_value("\n请问你要输入几个任务？", valid=lambda n: n >= 0, language="chinese")
    task_list = []
    for i in range(task_count):
        print(f"\n--- 第{i+1}个任务 ---")
        name = read_value("任务名称：", str, bool, language="chinese")
        duration = read_value("需要多少小时（以0.5小时为单位）：", float, valid_duration, language="chinese")
        while True:
            try:
                dl_date = input("截止日期【YYYY-MM-DD，例：2026-10-30】：")
                dl_time = input("截止时间【HH:MM，例：23:59】：")
                deadline = parse_date_time(dl_date, dl_time)
                break
            except ValueError:
                print('日期或时间无效，请使用YYYY-MM-DD和HH:MM格式。')
        priority = read_value("优先级（1最高，数字越大越低）：", valid=lambda n: n >= 1, language="chinese")
        task_list.append(Task(name=name, duration_hour=duration, deadline=deadline, priority=priority))

    planner.schedule(task_list)
    planner.show()
    return planner


if __name__ == "__main__":
    main()
