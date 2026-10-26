"use client";

import { useEffect, useRef, useState } from "react";
import { taskSuggestions } from "./task-suggestions";
import TaskNameField from "./task-name-field";
import { overlaps, slotTime, TOTAL_SLOTS, type CalendarEntry } from "./calendar-events";

type Labels = Record<"classes" | "tasks" | "noClasses" | "append" | "weekly" | "startsOn" | "seriesHint" | "newTask" | "newClass" | "editTask" | "editClass" | "title" | "date" | "from" | "to" | "save" | "cancel" | "remove" | "invalid" | "conflict", string>;
export default function EntryEditor({ entry, entries, language, labels: t, error, onSave, onDelete, onClose }: {
  entry: CalendarEntry; entries: CalendarEntry[]; language: keyof typeof taskSuggestions; labels: Labels; error: string;
  onSave: (entry: CalendarEntry) => void; onDelete: (entry: CalendarEntry) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(entry);
  const [validation, setValidation] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const heading = entry.kind === "task" ? (entry.id ? t.editTask : t.newTask) : (entry.id ? t.editClass : t.newClass);
  return <dialog ref={dialog} className="entry-dialog" aria-labelledby="entry-editor-heading" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <form onSubmit={event => {
      event.preventDefault();
      const next = { ...value, title: value.title.trim() };
      if (!next.title || next.end <= next.start) { setValidation(t.invalid); return; }
      if (overlaps(entries, next)) { setValidation(t.conflict); return; }
      onSave(next);
    }}>
      <h2 id="entry-editor-heading">{heading}</h2>
      {entry.kind === "task"
        ? <TaskNameField name={value.title} entries={entries} language={language} labels={t} autoFocus onChange={title => setValue({ ...value, title })} />
        : <label>{t.title}<input autoFocus required maxLength={120} value={value.title} onChange={event => setValue({ ...value, title: event.target.value })} /></label>}
      <label>{entry.kind === "class" ? t.startsOn : t.date}<input type="date" required value={value.date} onChange={event => setValue({ ...value, date: event.target.value })} /></label>
      <div className="time-fields">
        <label>{t.from}<select value={value.start} onChange={event => setValue({ ...value, start: Number(event.target.value) })}>{Array.from({ length: TOTAL_SLOTS }, (_, slot) => <option key={slot} value={slot}>{slotTime(slot)}</option>)}</select></label>
        <label>{t.to}<select value={value.end} onChange={event => setValue({ ...value, end: Number(event.target.value) })}>{Array.from({ length: TOTAL_SLOTS }, (_, slot) => <option key={slot + 1} value={slot + 1}>{slotTime(slot + 1)}</option>)}</select></label>
      </div>
      {entry.kind === "class" && <p className="editing-hint" style={{ paddingLeft: 0, marginBottom: 18 }}>{t.seriesHint}</p>}
      {(validation || error) && <p className="entry-error" role="alert">{validation || error}</p>}
      <div className="editor-actions">{entry.id && <button className="delete-entry" type="button" onClick={() => onDelete(entry)}>{t.remove}</button>}<button type="button" onClick={onClose}>{t.cancel}</button><button className="save-entry" type="submit">{t.save}</button></div>
    </form>
  </dialog>;
}
