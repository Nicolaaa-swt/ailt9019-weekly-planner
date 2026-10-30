"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";

import { dateKey, occursOn, overlaps, readEntries, slotTime, TOTAL_SLOTS, type CalendarEntry, type EntryKind } from "./calendar-events";
import EntryEditor from "./entry-editor";
import AIChat from "./ai-chat";
import TaskSchedulerDialog from "./task-scheduler-dialog";
import { readScheduleReports, scheduleTasks, type TaskRequest, type ScheduleReport } from "./task-scheduler";
import { schedulerCopy } from "./scheduler-copy";
import CalendarEntryBlock from "./calendar-entry";
import WeekHeading, { formatWeekRange } from "./week-heading";

const copy = {
  en: {
    noClasses: "No classes added yet", append: "Append to task name", weekly: "Repeats every week", startsOn: "Starts on", seriesHint: "Repeats weekly from this date. Changes and deletion apply to the whole series.", tasks: "Tasks", classes: "Classes", select: "Select a type to add or edit items", drag: "Drag an empty time slot to add", conflict: "Choose an empty time range. Items cannot overlap.", newTask: "New task", newClass: "New class", editTask: "Edit task", editClass: "Edit class", title: "Name", date: "Date", from: "From", to: "To", save: "Save", cancel: "Cancel", remove: "Delete", invalid: "Enter a name and choose an end time after the start time.",
    today: "Today", previous: "Previous week", next: "Next week", week: "Week", calendar: "Weekly calendar", light: "Switch to light mode", dark: "Switch to dark mode", days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  },
  zh: {
    noClasses: "尚未新增課堂", append: "附加至任務名稱", weekly: "每週重複", startsOn: "開始日期", seriesHint: "從此日期起每週重複。編輯及刪除將套用至整個系列。", tasks: "任務", classes: "課堂", select: "選擇類型以新增或編輯項目", drag: "拖曳空白時段以新增項目", conflict: "請選擇空白時段，項目不可重疊。", newTask: "新增任務", newClass: "新增課堂", editTask: "編輯任務", editClass: "編輯課堂", title: "名稱", date: "日期", from: "開始", to: "結束", save: "儲存", cancel: "取消", remove: "刪除", invalid: "請輸入名稱，並選擇晚於開始時間的結束時間。",
    today: "今天", previous: "上一週", next: "下一週", week: "週", calendar: "每週日曆", light: "切換至淺色模式", dark: "切換至深色模式", days: ["週一", "週二", "週三", "週四", "週五", "週六", "週日"],
  },
  "zh-Hans": {
    noClasses: "尚未新增课堂", append: "附加至任务名称", weekly: "每周重复", startsOn: "开始日期", seriesHint: "从此日期起每周重复。编辑及删除将应用于整个系列。", tasks: "任务", classes: "课堂", select: "选择类型以新增或编辑项目", drag: "拖动空白时段以新增项目", conflict: "请选择空白时段，项目不可重叠。", newTask: "新增任务", newClass: "新增课堂", editTask: "编辑任务", editClass: "编辑课堂", title: "名称", date: "日期", from: "开始", to: "结束", save: "保存", cancel: "取消", remove: "删除", invalid: "请输入名称，并选择晚于开始时间的结束时间。",
    today: "今天", previous: "上一周", next: "下一周", week: "周", calendar: "每周日历", light: "切换至浅色模式", dark: "切换至深色模式", days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  },
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("planner-preferences", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("planner-preferences", callback);
  };
}
function readPreference(key: string, fallback: string) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function savePreference(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Storage may be unavailable. */ }
  window.dispatchEvent(new Event("planner-preferences"));
}

function Icon({ name, size = 18 }: { name: "sun" | "moon" | "left" | "right" | "calendar" | "globe"; size?: number }) {
  const paths = {
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    moon: <path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z" />,
    left: <path d="m14 6-6 6 6 6" />,
    right: <path d="m10 6 6 6-6 6" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function parseDate(value: string) { return new Date(`${value}T12:00:00`); }
function monday(value: string) {
  const date = parseDate(value);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return date;
}
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

export default function Calendar({ today }: { today: string }) {
  const theme = useSyncExternalStore(subscribe, () => readPreference("weekspace-theme", "light"), () => "light");
  const language = useSyncExternalStore(subscribe, () => readPreference("weekspace-language", "en"), () => "en");
  const lang = language === "zh" ? "zh" : language === "zh-Hans" ? "zh-Hans" : "en";
  const t = { ...copy[lang], ...schedulerCopy[lang] };
  const locale = lang === "zh" ? "zh-Hant-HK" : lang === "zh-Hans" ? "zh-Hans-CN" : "en-GB";
  const toolbarRef = useRef<HTMLElement>(null);
  const [toolbarWrapped, setToolbarWrapped] = useState(false);
  const [start, setStart] = useState(() => monday(today));
  const [mode, setMode] = useState<EntryKind | null>(null);
  const [draft, setDraft] = useState<CalendarEntry | null>(null);
  const [scheduler, setScheduler] = useState<{ report: ScheduleReport | null } | null>(null);
  const [message, setMessage] = useState("");
  const rawEntries = useSyncExternalStore(subscribe, () => readPreference("weekspace-entries", "[]"), () => "[]");
  const entries = useMemo(() => readEntries(rawEntries), [rawEntries]);
  type Selection = { date: string; anchor: number; current: number };
  const dragRef = useRef<Selection | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const currentDate = parseDate(today);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
  const end = days[6];
  const rangeFormat = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" });
  const range = formatWeekRange(start, end, locale, lang !== "en");
  function adjacentWeek(offset: number) {
    const first = new Date(start);
    first.setDate(first.getDate() + offset * 7);
    const last = new Date(first);
    last.setDate(last.getDate() + 6);
    const label = lang === "en"
      ? new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).formatRange(first, last).replace(/\s/g, " ")
      : `${first.getMonth() + 1}/${first.getDate()} – ${last.getMonth() + 1}/${last.getDate()}`;
    return { label, full: rangeFormat.formatRange(first, last).replace(/\s/g, " ") };
  }
  const previousWeek = adjacentWeek(-1);
  const nextWeek = adjacentWeek(1);
  useEffect(() => { document.documentElement.lang = lang === "zh" ? "zh-Hant" : lang === "zh-Hans" ? "zh-Hans" : "en"; }, [lang]);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const measure = () => {
      const style = getComputedStyle(toolbar);
      const children = Array.from(toolbar.children);
      const required = children.reduce((width, child) => width + child.getBoundingClientRect().width, 0)
        + Math.max(0, children.length - 1) * parseFloat(style.columnGap || "0");
      const available = toolbar.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setToolbarWrapped(required > available + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar);
    Array.from(toolbar.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  function selectedEntry(value: Selection): CalendarEntry {
    return { id: "", kind: mode || "task", title: "", date: value.date, start: Math.min(value.anchor, value.current), end: Math.max(value.anchor, value.current) + 1 };
  }
  function pointerSlot(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return Math.min(TOTAL_SLOTS - 1, Math.max(0, Math.floor((event.clientY - box.top) / box.height * TOTAL_SLOTS)));
  }
  function beginSelection(event: PointerEvent<HTMLDivElement>, date: string) {
    if (!mode || event.button !== 0 || (event.target as HTMLElement).closest(".calendar-event")) return;
    event.preventDefault();
    const slot = pointerSlot(event);
    if (overlaps(entries, { id: "", kind: mode, title: "", date, start: slot, end: slot + 1 })) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { date, anchor: slot, current: slot };
    setSelection(dragRef.current);
    setMessage("");
  }
  function updateSelection(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    dragRef.current = { ...dragRef.current, current: pointerSlot(event) };
    setSelection(dragRef.current);
  }
  function finishSelection(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const entry = selectedEntry({ ...dragRef.current, current: pointerSlot(event) });
    dragRef.current = null;
    setSelection(null);
    if (!mode) return;
    if (overlaps(entries, entry)) { setMessage(t.conflict); return; }
    setDraft(entry);
  }
  function cancelSelection() { dragRef.current = null; setSelection(null); }
  function chooseMode(value: EntryKind) {
    cancelSelection();
    setDraft(null);
    setMessage("");
    setMode(previous => previous === value ? null : value);
  }
  function saveEntry(entry: CalendarEntry) {
    if (entry.kind !== mode) return;
    const latest = readEntries(readPreference("weekspace-entries", "[]"));
    if (overlaps(latest, entry)) { setMessage(t.conflict); return; }
    savePreference("weekspace-entries", JSON.stringify([...latest.filter(item => item.id !== entry.id), { ...entry, id: entry.id || crypto.randomUUID() }]));
    setDraft(null);
    setMessage("");
  }
  function deleteEntry(entry: CalendarEntry) {
    if (entry.kind !== mode) return;
    savePreference("weekspace-entries", JSON.stringify(readEntries(readPreference("weekspace-entries", "[]")).filter(item => item.id !== entry.id)));
    setDraft(null);
  }

  function scheduleNewTasks(tasks: TaskRequest[]) {
    const previousEntries = readPreference("weekspace-entries", "[]");
    const latestEntries = readEntries(previousEntries);
    const result = scheduleTasks(dateKey(start), tasks, latestEntries);
    const latestReports = readScheduleReports(readPreference("weekspace-schedule-reports", "{}"));
    // Preserve the original calendar if either storage write fails.
    localStorage.setItem("weekspace-entries", JSON.stringify([...latestEntries, ...result.entries]));
    try {
      localStorage.setItem("weekspace-schedule-reports", JSON.stringify({ ...latestReports, [dateKey(start)]: result.report }));
    } catch (error) {
      localStorage.setItem("weekspace-entries", previousEntries);
      throw error;
    }
    window.dispatchEvent(new Event("planner-preferences"));
    return result.report;
  }

  function moveWeek(direction: number) {
    setStart(previous => {
      const next = new Date(previous);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  }

  return (
    <main className="planner" lang={lang === "zh" ? "zh-Hant" : lang} data-theme={theme === "dark" ? "dark" : "light"} data-editing={mode !== null}
      onDoubleClick={event => {
        const target = event.target as Element;
        if (draft || scheduler || target.closest('.calendar, dialog, button, a, input, select, textarea, [role="button"], [contenteditable="true"], .ai-chat-panel')) return;
        cancelSelection();
        setMode(null);
        setMessage("");
      }}>
      <section ref={toolbarRef} className="calendar-toolbar" data-wrapped={toolbarWrapped} aria-label={t.calendar}>
          <WeekHeading first={start} last={end} range={range} locale={locale} chinese={lang !== "en"} />
          <div className="editing-tools">
          <div className="editing-actions">
          <button className="add-tasks-button" aria-label={t.addTasks} onClick={() => setScheduler({ report: null })}>+ {t.tasks}</button>
          <div className="entry-type-toggle" role="group" aria-label={t.select}>
            <button aria-pressed={mode === "task"} onClick={() => chooseMode("task")}>{t.tasks}</button>
            <button aria-pressed={mode === "class"} onClick={() => chooseMode("class")}>{t.classes}</button>
          </div>
          </div>
          <p className="editing-hint" role="status">{message || (mode ? t.drag : t.select)}</p>
          </div>
        <div className="calendar-controls">
          <button className="today-button" onClick={() => setStart(monday(today))}>{t.today}</button>
          <div className="week-navigation">
            <button className="icon-button week-nav-button" aria-label={`${t.previous}: ${previousWeek.full}`} title={`${t.previous}: ${previousWeek.full}`} onClick={() => moveWeek(-1)}><Icon name="left" size={17} /><span>{previousWeek.label}</span></button>
            <button className="icon-button week-nav-button" aria-label={`${t.next}: ${nextWeek.full}`} title={`${t.next}: ${nextWeek.full}`} onClick={() => moveWeek(1)}><span>{nextWeek.label}</span><Icon name="right" size={17} /></button>
          </div>
        </div>
      <div className="floating-preferences">
        <button className="theme-toggle" onClick={() => savePreference("weekspace-theme", theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? t.light : t.dark} title={theme === "dark" ? t.light : t.dark}>
          <span className={theme !== "dark" ? "toggle-option selected" : "toggle-option"}><Icon name="sun" size={16} /></span><span className={theme === "dark" ? "toggle-option selected" : "toggle-option"}><Icon name="moon" size={15} /></span>
        </button>
        <div className="language-options" role="group" aria-label={lang === "en" ? "Language" : lang === "zh" ? "語言" : "语言"}>
          {([{ value: "en", label: "EN", name: "English" }, { value: "zh", label: "繁", name: "繁體中文" }, { value: "zh-Hans", label: "简", name: "简体中文" }] as const).map(option => <button key={option.value} className={lang === option.value ? "language-option selected" : "language-option"} aria-label={option.name} title={option.name} aria-pressed={lang === option.value} onClick={() => savePreference("weekspace-language", option.value)}>{option.label}</button>)}
        </div>
      </div>
      </section>
      <section className="calendar" aria-label={`${t.calendar}: ${range}`}>
        <div className="calendar-canvas">
          <div className="day-headers"><div className="timezone-label">GMT+8</div>{days.map((date, i) => <div key={i} className={`day-heading ${sameDay(date, currentDate) ? "is-today" : ""} ${i > 4 ? "weekend" : ""}`} aria-current={sameDay(date, currentDate) ? "date" : undefined}><span className="day-name">{t.days[i]}</span><span className="day-number">{date.getDate()}</span>{sameDay(date, currentDate) && <span className="today-dot" />}</div>)}</div>
          <div className="time-grid">
            <div className="time-axis" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <span key={i} style={{ top: `${i / 13 * 100}%` }}>{String(i + 9).padStart(2, "0")}:00</span>)}</div>
            {days.map((date, i) => {
              const key = dateKey(date);
              const preview = selection?.date === key ? selectedEntry(selection) : null;
              return <div key={key} className={`day-column ${mode ? "is-editing" : ""} ${i > 4 ? "weekend" : ""} ${sameDay(date, currentDate) ? "current-column" : ""}`} aria-label={new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(date)}
                tabIndex={mode ? 0 : undefined} onPointerDown={event => beginSelection(event, key)} onPointerMove={updateSelection} onPointerUp={finishSelection} onPointerCancel={cancelSelection} onLostPointerCapture={cancelSelection}
                onKeyDown={event => {
                  if (event.key === "Escape") cancelSelection();
                  if (!mode || (event.key !== "Enter" && event.key !== " ") || event.target !== event.currentTarget) return;
                  event.preventDefault();
                  const slot = Array.from({ length: TOTAL_SLOTS }, (_, start) => ({ id: "", title: "", kind: mode, date: key, start, end: start + 1 })).find(entry => !overlaps(entries, entry));
                  if (slot) { setMessage(""); setDraft(slot); } else setMessage(t.conflict);
                }}>
                {entries.filter(entry => occursOn(entry, key)).map(entry => <CalendarEntryBlock key={entry.id} entry={entry} editable={mode === entry.kind} kindLabel={entry.kind === "task" ? t.tasks : t.classes} onEdit={() => { if (mode === entry.kind) { setMessage(""); setDraft(entry); } }} onSelectMode={() => { cancelSelection(); setMode(entry.kind); setMessage(""); }} />)}
                {preview && <div className={`selection-preview ${preview.kind} ${overlaps(entries, preview) ? "conflict" : ""}`} style={{ top: `${preview.start / TOTAL_SLOTS * 100}%`, height: `${(preview.end - preview.start) / TOTAL_SLOTS * 100}%` }}>{slotTime(preview.start)}–{slotTime(preview.end)}</div>}
              </div>;
            })}
          </div>
        </div>
      </section>
      {draft && <EntryEditor entry={draft} entries={entries} language={lang} labels={t} error={message} onSave={saveEntry} onDelete={deleteEntry} onClose={() => { setDraft(null); setMessage(""); }} />}
      {scheduler && <TaskSchedulerDialog entries={entries} language={lang} labels={t} weekStart={dateKey(start)} weekEnd={dateKey(end)} initialReport={scheduler.report} onSchedule={scheduleNewTasks} onClearReport={() => {
        const latest = readScheduleReports(readPreference("weekspace-schedule-reports", "{}"));
        delete latest[dateKey(start)];
        savePreference("weekspace-schedule-reports", JSON.stringify(latest));
        setScheduler(null);
      }} onClose={() => setScheduler(null)} />}
      <AIChat language={lang} calendar={{ weekStart: dateKey(start), weekEnd: dateKey(end), entries }} />
    </main>
  );
}
