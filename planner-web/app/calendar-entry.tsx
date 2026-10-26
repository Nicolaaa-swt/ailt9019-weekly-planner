"use client";

import { useEffect, useRef, useState } from "react";
import { slotTime, TOTAL_SLOTS, type CalendarEntry } from "./calendar-events";

export default function CalendarEntryBlock({ entry, editable, kindLabel, onEdit }: {
  entry: CalendarEntry; editable: boolean; kindLabel: string; onEdit: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const titleText = useRef<HTMLSpanElement>(null);
  const timeText = useRef<HTMLSpanElement>(null);
  const [hideTime, setHideTime] = useState(false);
  const compact = entry.end - entry.start === 1;
  const time = `${slotTime(entry.start)}–${slotTime(entry.end)}`;

  useEffect(() => {
    const element = button.current;
    const title = titleText.current;
    const time = timeText.current;
    if (!compact || !element || !title || !time) return;
    const measure = () => {
      const style = getComputedStyle(element);
      const available = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setHideTime(title.getBoundingClientRect().width + time.getBoundingClientRect().width + 8 > available);
    };
    const observer = new ResizeObserver(measure);
    [element, title, time].forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [compact, entry.title, time]);

  return <button ref={button} className={`calendar-event ${entry.kind}${compact ? " compact-event" : ""}`} data-hide-time={compact && hideTime} disabled={!editable}
    style={{ top: `calc(${entry.start / TOTAL_SLOTS * 100}% + 1px)`, height: `calc(${(entry.end - entry.start) / TOTAL_SLOTS * 100}% - 2px)` }}
    onClick={onEdit} title={`${entry.title}, ${time}`} aria-label={`${entry.title}, ${time}, ${kindLabel}`}>
    <strong><span ref={titleText} className="event-title-text">{entry.title}</span></strong>
    <span ref={timeText} className="event-time">{time}</span>
  </button>;
}
