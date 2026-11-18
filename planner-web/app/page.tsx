import Calendar from "./calendar";
import { connection } from "next/server";
import { Suspense } from "react";

async function CurrentCalendar() {
  await connection();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <Calendar today={today} />;
}

export default function Home() {
  return (
    <main className="planner" aria-busy="true">
      {/* 1. Original Calendar & Agent Core Functionality */}
      <Suspense fallback={null}>
        <CurrentCalendar />
      </Suspense>

      {/* 2. Project Documentation Section (Instruction, Example, Result, Limitation) */}
      <div style={{ maxWidth: '800px', margin: '60px auto 40px auto', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#333', padding: '0 20px', borderTop: '2px solid #eaeaea', paddingTop: '40px' }}>
        
        {/* Instruction */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '8px', color: '#111' }}>1. Instruction</h2>
          <p>Welcome to the Weekly Task Planning Agent! Follow these simple steps to generate your 7-day study and task plan:</p>
          <ol style={{ paddingLeft: '20px' }}>
            <li><strong>Setup &amp; Run:</strong> Unzip the project folder, open a terminal, and run <code>python app.py</code>[cite: 3].</li>
            <li><strong>Access Web App:</strong> Open the local URL printed in your terminal using a web browser[cite: 3].</li>
            <li><strong>Input Details:</strong> Enter your tasks for the upcoming week (including task name, deadline, estimated duration, and importance level: high/medium/low) along with your daily available study time[cite: 1, 2].</li>
          </ol>
        </section>

        {/* Genuine Run Example */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '8px', color: '#111' }}>2. Genuine Run Example</h2>
          <p>Below is a genuine example of user input and the corresponding agent scheduling response:</p>
          <div style={{ background: '#f1f8ff', padding: '15px', borderLeft: '4px solid #0366d6', borderRadius: '0 6px 6px 0', marginBottom: '10px' }}>
            <p><strong>User Input:</strong></p>
            <p><em>“Microeconomics assignment (due Day 3, 4 hours estimated duration, High importance), Discrete Mathematics problem set (due Day 5, 3 hours estimated duration, Medium importance). Daily available study time is 4 hours.”</em></p>
          </div>
          <div style={{ background: '#f6f8fa', padding: '15px', borderLeft: '4px solid #28a745', borderRadius: '0 6px 6px 0' }}>
            <p><strong>Agent Response:</strong></p>
            <p><em>Generated a 7-day schedule: Day 1 prioritizes Microeconomics (2 hours), Day 2 completes Microeconomics (remaining 2 hours), and Day 3 schedules Discrete Mathematics (3 hours). All tasks are planned before their deadlines without exceeding the daily 4-hour limit.</em></p>
          </div>
        </section>

        {/* Concise Result */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '8px', color: '#111' }}>3. Concise Result</h2>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Automated Pipeline:</strong> Successfully implemented an end-to-end pipeline spanning natural language task input, structured JSON parsing, and a deterministic rule-based priority scoring and greedy allocation engine[cite: 2].</li>
            <li><strong>Smart Scheduling:</strong> Performs intelligent prioritization based on a multi-factor scoring formula (urgency, importance, and workload pressure), and automatically triggers an infeasibility report when conflicting constraints arise[cite: 2, 3].</li>
          </ul>
        </section>

        {/* Limitation */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '8px', color: '#111' }}>4. Limitation</h2>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>No Automated Website Syncing:</strong> The system cannot automatically connect to university portals or external learning management systems to fetch to-do items; all tasks must be entered manually by the user[cite: 1].</li>
            <li><strong>No Active Reminder Function:</strong> The agent provides a static 7-day schedule output and does not include active push notifications or automated reminders. To receive real-time alerts, the web application must remain open continuously[cite: 1].</li>
          </ul>
        </section>

      </div>
    </main>
  );
}
