"use client";

import { useEffect, useRef } from "react";

export function formatWeekRange(first: Date, last: Date, locale: string, chinese: boolean) {
  return chinese
    ? `${first.getFullYear()} 年 ${first.getMonth() + 1} 月 ${first.getDate()} 日 — ${first.getFullYear() !== last.getFullYear() ? `${last.getFullYear()} 年 ` : ""}${last.getMonth() + 1} 月 ${last.getDate()} 日`
    : new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).formatRange(first, last).replace(/\s/g, " ");
}

export default function WeekHeading({ range, locale, chinese }: { range: string; locale: string; chinese: boolean }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    // A leap year covers every month/day combination, including year-crossing weeks.
    // Tabular numerals keep the resulting width independent of the four-digit year.
    const candidates = Array.from({ length: 366 }, (_, index) => {
      const first = new Date(2028, 0, index + 1, 12);
      const last = new Date(2028, 0, index + 7, 12);
      return formatWeekRange(first, last, locale, chinese);
    });
    const measure = () => {
      const probe = document.createElement("span");
      probe.setAttribute("aria-hidden", "true");
      Object.assign(probe.style, { position: "absolute", visibility: "hidden", whiteSpace: "nowrap", width: "max-content", pointerEvents: "none" });
      heading.appendChild(probe);
      let widest = 0;
      for (const candidate of candidates) {
        probe.textContent = candidate;
        widest = Math.max(widest, probe.getBoundingClientRect().width);
      }
      probe.remove();
      heading.style.width = `${Math.ceil(widest)}px`;
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts.addEventListener("loadingdone", measure);
    return () => {
      window.removeEventListener("resize", measure);
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [locale, chinese]);
  return <h1 ref={headingRef} className="week-heading" aria-live="polite" title={range}>{range}</h1>;
}
