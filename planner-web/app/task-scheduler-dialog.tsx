"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarEntry } from "./calendar-events";
import { taskSuggestions } from "./task-suggestions";
import TaskNameField, { type NameLabels } from "./task-name-field";
import { validTask, type TaskRequest, type ScheduleReport } from "./task-scheduler";

export type SchedulerLabels = NameLabels & Record<"clearReport" | "addTasks" | "scheduleIntro" | "duration" | "deadlineDate" | "deadlineTime" | "priority" | "priorityHint" | "anotherTask" | "schedule" | "cancel" | "remove" | "done" | "results" | "scheduledHours" | "remainingHours" | "deadlineReason" | "availabilityReason" | "taskValidation" | "hours" | "taskNumber" | "saveFailure", string>;
type TaskForm = { key: number; title: string; duration: string; date: string; time: string; priority: string };
export default function TaskSchedulerDialog({ entries, language, labels: t, weekStart, weekEnd, initialReport, onSchedule, onClearReport, onClose }: {
  entries: CalendarEntry[]; language: keyof typeof taskSuggestions; labels: SchedulerLabels; weekStart: string; weekEnd: string; initialReport: ScheduleReport | null;
  onSchedule: (tasks: TaskRequest[]) => ScheduleReport; onClearReport: () => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const nextKey = useRef(1);
  const [rows, setRows] = useState<TaskForm[]>([{ key: 0, title: "", duration: "1", date: weekEnd, time: "23:59", priority: "1" }]);
  const [report, setReport] = useState(initialReport);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  function update(key: number, changes: Partial<TaskForm>) { setRows(previous => previous.map(row => row.key === key ? { ...row, ...changes } : row)); }
  return <dialog ref={dialog} className="entry-dialog scheduler-dialog" aria-labelledby="scheduler-heading" onCancel={onClose}>
    {report ? <>
      <h2 id="scheduler-heading">{t.results}</h2>
      <p className="schedule-intro">{report.weekStart}</p>
      <ul className="schedule-results">{report.outcomes.map(task => <li key={task.id}>
        <strong>{task.title}</strong>
        <p>{t.priority}: {task.priority} · {t.deadlineDate}: {task.deadline.replace("T", " ")}</p>
        <p>{t.scheduledHours}: {task.scheduledHours} {t.hours}</p>
        {task.remainingHours > 0 && <><p className="remaining-hours">{t.remainingHours}: {task.remainingHours} {t.hours}</p><p>{task.reason === "deadline" ? t.deadlineReason : t.availabilityReason}</p></>}
      </li>)}</ul>
      <div className="editor-actions"><button className="delete-entry" onClick={onClearReport}>{t.clearReport}</button><button className="save-entry" onClick={onClose}>{t.done}</button></div>
    </> : <form onSubmit={event => {
      event.preventDefault();
      const tasks = rows.map(row => ({ id: crypto.randomUUID(), title: row.title.trim(), durationHours: Number(row.duration), deadline: `${row.date}T${row.time}`, priority: Number(row.priority) }));
      if (!tasks.length || tasks.some(task => !validTask(task))) { setError(t.taskValidation); return; }
      try { setReport(onSchedule(tasks)); } catch { setError(t.saveFailure); }
    }}>
      <h2 id="scheduler-heading">{t.addTasks}</h2>
      <p className="schedule-intro">{t.scheduleIntro}<br />{weekStart} — {weekEnd}</p>
      <div className="task-form-list">{rows.map((row, index) => <fieldset key={row.key} className="task-form-card">
        <legend>{t.taskNumber} {index + 1}</legend>
        {rows.length > 1 && <button className="remove-task-row" type="button" aria-label={`${t.remove}: ${t.taskNumber} ${index + 1}`} onClick={() => setRows(previous => previous.filter(item => item.key !== row.key))}>×</button>}
        <TaskNameField name={row.title} entries={entries} language={language} labels={t} autoFocus={index === 0} onChange={title => update(row.key, { title })} />
        <div className="time-fields">
          <label>{t.duration}<input type="number" required min="0.5" step="0.5" value={row.duration} onChange={event => update(row.key, { duration: event.target.value })} /></label>
          <label>{t.priority}<input type="number" required min="1" step="1" value={row.priority} onChange={event => update(row.key, { priority: event.target.value })} /><span className="field-hint">{t.priorityHint}</span></label>
        </div>
        <div className="time-fields">
          <label>{t.deadlineDate}<input type="date" required value={row.date} onInput={event => update(row.key, { date: event.currentTarget.value })} onChange={event => update(row.key, { date: event.target.value })} /></label>
          <label>{t.deadlineTime}<input type="time" required step="60" value={row.time} onInput={event => update(row.key, { time: event.currentTarget.value })} onChange={event => update(row.key, { time: event.target.value })} /></label>
        </div>
      </fieldset>)}</div>
      <button type="button" className="another-task" onClick={() => setRows(previous => [...previous, { key: nextKey.current++, title: "", duration: "1", date: weekEnd, time: "23:59", priority: "1" }])}>+ {t.anotherTask}</button>
      {error && <p role="alert" className="entry-error">{error}</p>}
      <div className="editor-actions"><button type="button" onClick={onClose}>{t.cancel}</button><button type="submit" className="save-entry">{t.schedule}</button></div>
    </form>}
  </dialog>;
}
