import Calendar from "./calendar";
import { connection } from "next/server";
import { Suspense } from "react";

async function CurrentCalendar() {
  await connection();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <Calendar today={today} />;
}

export default function Home() {
  return <Suspense fallback={<main className="planner" aria-busy="true" />}><CurrentCalendar /></Suspense>;
}
