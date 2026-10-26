"use client";

import { useRef } from "react";
import { appendSuggestion, taskSuggestions } from "./task-suggestions";
import type { CalendarEntry } from "./calendar-events";

export type NameLabels = Record<"title" | "classes" | "tasks" | "noClasses" | "append", string>;
export default function TaskNameField({ name, entries, language, labels: t, onChange, autoFocus = false }: {
  name: string; entries: CalendarEntry[]; language: keyof typeof taskSuggestions; labels: NameLabels; onChange: (name: string) => void; autoFocus?: boolean;
}) {
  const nameInput = useRef<HTMLInputElement>(null);
  const classNames = [...new Set(entries.filter(item => item.kind === "class").map(item => item.title.trim()).filter(Boolean))];
  function suggestionButton(text: string) {
    return <button type="button" key={text} className="quick-add-suggestion" title={text} aria-label={`${t.append}: ${text}`} disabled={appendSuggestion(name, text).length > 120} onClick={() => {
      onChange(appendSuggestion(name, text));
      requestAnimationFrame(() => {
        const input = nameInput.current;
        input?.focus();
        input?.setSelectionRange(input.value.length, input.value.length);
      });
    }}><span>{text}</span><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 12 4M8 4h4v4" /></svg></button>;
  }
  return <>
    <label>{t.title}<input ref={nameInput} autoFocus={autoFocus} required maxLength={120} value={name} onChange={event => onChange(event.target.value)} /></label>
    <div className="task-quick-add">
      <div className="quick-add-row" role="group" aria-label={t.classes}><span className="quick-add-label">{t.classes}</span><div className="quick-add-options">{classNames.length ? classNames.map(suggestionButton) : <span className="quick-add-empty">{t.noClasses}</span>}</div></div>
      <div className="quick-add-row" role="group" aria-label={t.tasks}><span className="quick-add-label">{t.tasks}</span><div className="quick-add-options">{taskSuggestions[language].map(suggestionButton)}</div></div>
    </div>
  </>;
}
