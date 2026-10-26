// Task examples from sample_schedule.txt and sample_schedule_chinese.txt.
export const taskSuggestions = {
  en: ["Report", "Study"],
  zh: ["寫報告", "複習筆記"],
  "zh-Hans": ["写报告", "复习笔记"],
} as const;

export function appendSuggestion(name: string, suggestion: string) {
  return name.trimEnd() ? `${name.trimEnd()} ${suggestion}` : suggestion;
}
