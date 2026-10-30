"use client";

export function formatWeekRange(first: Date, last: Date, locale: string, chinese: boolean) {
  return chinese
    ? `${first.getFullYear()} 年 ${first.getMonth() + 1} 月 ${first.getDate()} 日 — ${first.getFullYear() !== last.getFullYear() ? `${last.getFullYear()} 年 ` : ""}${last.getMonth() + 1} 月 ${last.getDate()} 日`
    : new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).formatRange(first, last).replace(/\s/g, " ");
}

export default function WeekHeading({ first, last, range, locale, chinese }: {
  first: Date; last: Date; range: string; locale: string; chinese: boolean;
}) {
  const dates = chinese
    ? `${first.getMonth() + 1} 月 ${first.getDate()} 日 — ${last.getMonth() + 1} 月 ${last.getDate()} 日`
    : new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).formatRange(first, last).replace(/\s/g, " ");
  const years = first.getFullYear() === last.getFullYear()
    ? `${first.getFullYear()}`
    : `${first.getFullYear()} – ${last.getFullYear()}`;
  return <h1 className="week-heading" aria-live="polite" aria-label={range} title={range}>
    <span className="week-date-range">{dates}</span>
    <span className="week-year">{years}{chinese ? " 年" : ""}</span>
  </h1>;
}
