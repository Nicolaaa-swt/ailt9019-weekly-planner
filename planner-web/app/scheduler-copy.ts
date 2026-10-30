export const schedulerCopy = {
  en: {
    clearReport: "Dismiss report", addTasks: "Add tasks", scheduleIntro: "Schedule into this week's free 30-minute slots, by priority then deadline. Dates before today are skipped. Existing entries stay in place. Times are Hong Kong time.",
    duration: "Duration (hours)", deadlineDate: "Deadline date", deadlineTime: "Deadline time", priority: "Priority", priorityHint: "1 = highest", anotherTask: "Another task", schedule: "Schedule tasks", done: "Done", results: "Scheduling result", scheduledHours: "Scheduled", remainingHours: "Could not schedule", deadlineReason: "No schedulable half-hour remains before the deadline in this week.", availabilityReason: "Not enough free time before the deadline in this week, including classes and existing tasks.", taskValidation: "Enter a name, a positive duration in 0.5-hour steps, a valid deadline, and an integer priority of 1 or higher.", hours: "hours", taskNumber: "Task", saveFailure: "Could not save the schedule. Check that browser storage is available and try again.",
  },
  zh: {
    clearReport: "清除結果", addTasks: "新增任務", scheduleIntro: "按優先次序及截止時間，排入本週空白的 30 分鐘時段。略過今天之前的日期。現有項目維持原位。時間均為香港時間。",
    duration: "所需時間（小時）", deadlineDate: "截止日期", deadlineTime: "截止時間", priority: "優先次序", priorityHint: "1 = 最高", anotherTask: "另一項任務", schedule: "安排任務", done: "完成", results: "排程結果", scheduledHours: "已安排", remainingHours: "未能安排", deadlineReason: "本週截止時間前已無可安排的半小時時段。", availabilityReason: "本週截止前的空白時間不足，包括課堂及現有任務佔用的時段。", taskValidation: "請輸入名稱、以 0.5 小時為單位的正數時長、有效截止時間，以及大於或等於 1 的整數優先次序。", hours: "小時", taskNumber: "任務", saveFailure: "無法儲存排程。請確認瀏覽器儲存空間可用後重試。",
  },
  "zh-Hans": {
    clearReport: "清除结果", addTasks: "新增任务", scheduleIntro: "按优先级及截止时间，排入本周空白的 30 分钟时段。跳过今天之前的日期。现有项目保持原位。时间均为香港时间。",
    duration: "所需时间（小时）", deadlineDate: "截止日期", deadlineTime: "截止时间", priority: "优先级", priorityHint: "1 = 最高", anotherTask: "另一项任务", schedule: "安排任务", done: "完成", results: "排程结果", scheduledHours: "已安排", remainingHours: "未能安排", deadlineReason: "本周截止时间前已无可安排的半小时时段。", availabilityReason: "本周截止前的空白时间不足，包括课堂及现有任务占用的时段。", taskValidation: "请输入名称、以 0.5 小时为单位的正数时长、有效截止时间，以及大于或等于 1 的整数优先级。", hours: "小时", taskNumber: "任务", saveFailure: "无法保存排程。请确认浏览器存储空间可用后重试。",
  },
} as const;
