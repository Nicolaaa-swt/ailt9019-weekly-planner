import Calendar from "./calendar";
import { connection } from "next/server";
import { Suspense } from "react";

async function CurrentCalendar() {
  await connection();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return <Calendar today={today} />;
}

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* ========== 原来的核心工作板块（完全不动原有逻辑） ========== */}
      <Suspense fallback={<div className="planner" aria-busy="true">Loading planner...</div>}>
        <CurrentCalendar />
      </Suspense>

      {/* ========== 新增独立说明板块，和上面规划器分开，包含你要求4部分 ========== */}
      <section className="mt-16 bg-slate-50 rounded-xl p-6 border border-slate-200">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 border-l-4 border-blue-500 pl-3 mb-3">
            1. Instruction
          </h2>
          <p className="text-slate-700">
            Welcome to the Weekly Task Planning Agent! Follow these simple steps to generate your 7-day study and task plan:
          </p>
          <ul className="list-disc pl-6 mt-2 text-slate-700 space-y-1">
            <li>
              <strong>Setup & Run:</strong> Unzip the project folder, open a terminal, and run <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 text-sm font-mono">python app.py</code>.
            </li>
            <li>
              <strong>Access Web App:</strong> Open the local URL printed in your terminal using a web browser.
            </li>
            <li>
              <strong>Input Details:</strong> Enter your tasks for the upcoming week (including task name, deadline, estimated duration, and importance level: high/medium/low) along with your daily available study time.
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 border-l-4 border-blue-500 pl-3 mb-3">
            2. Genuine Run Example
          </h2>
          <p className="text-slate-700">
            Below is a genuine example of user input and the corresponding agent scheduling response:
          </p>
          <div className="bg-blue-50 p-4 rounded-lg my-4">
            <p className="text-slate-700">
              <strong>User Input:</strong> Microeconomics assignment (due Day 3, 4 hours estimated duration, High importance), Discrete Mathematics problem set (due Day 5, 3 hours estimated duration, Medium importance). Daily available study time is 4 hours.
            </p>
            <p className="text-slate-700 mt-2">
              <strong>Agent Response:</strong> Generated a 7-day schedule: Day 1 prioritizes Microeconomics (2 hours), Day 2 completes Microeconomics (remaining 2 hours), and Day 3 schedules Discrete Mathematics (3 hours). All tasks are planned before their deadlines without exceeding the daily 4-hour limit.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 border-l-4 border-blue-500 pl-3 mb-3">
            3. Concise Result
          </h2>
          <ul className="list-disc pl-6 mt-2 text-slate-700 space-y-1">
            <li>
              <strong>Automated Pipeline:</strong> Successfully implemented an end-to-end pipeline spanning natural language task input, structured JSON parsing, and a deterministic rule-based priority scoring and greedy allocation engine.
            </li>
            <li>
              <strong>Smart Scheduling:</strong> Performs intelligent prioritization based on a multi-factor scoring formula (urgency, importance, and workload pressure), and automatically triggers an infeasibility report when conflicting constraints arise.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-800 border-l-4 border-blue-500 pl-3 mb-3">
            4. Limitation
          </h2>
          <div className="bg-amber-50 p-4 rounded-lg">
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>
                <strong>No Automated Website Syncing:</strong> The system cannot automatically connect to university portals or external learning management systems to fetch to-do items; all tasks must be entered manually by the user.
              </li>
              <li>
                <strong>No Active Reminder Function:</strong> The agent provides a static 7-day schedule output and does not include active push notifications or automated reminders. To receive real-time alerts, the web application must remain open continuously.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
