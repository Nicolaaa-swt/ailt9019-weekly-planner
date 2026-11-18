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
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      
      {/* 顶部固定导航栏，带有分区跳转链接 */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 100,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "18px", color: "#111827" }}>
          Weekly Task Planning Agent
        </div>
        <nav style={{ display: "flex", gap: "16px" }}>
          <a
            href="#calendar-section"
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Workspace (Calendar)
          </a>
          <a
            href="#docs-section"
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: "#0366d6",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Project Documentation
          </a>
        </nav>
      </header>

      {/* 分区 1：原有的日历工作台 */}
      <div id="calendar-section">
        <Suspense fallback={null}>
          <CurrentCalendar />
        </Suspense>
      </div>

      {/* 分区 2：作业说明长页面区域 */}
      <div
        id="docs-section"
        style={{
          width: "100%",
          backgroundColor: "#f9fafb",
          borderTop: "2px solid #eaeaea",
          padding: "60px 20px",
          marginTop: "40px",
          boxSizing: "border-box",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", lineHeight: "1.6", color: "#333" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontSize: "28px", color: "#111", marginBottom: "10px" }}>
              Project Documentation &amp; Evaluation
            </h1>
            <p style={{ color: "#666" }}>AILT9019 AI Literacy II — Weekly Task Planning Agent</p>
          </div>

          {/* 1. Instruction */}
          <section style={{ marginBottom: "30px", background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <h2 style={{ marginTop: 0, color: "#0366d6", fontSize: "20px" }}>1. Instruction</h2>
            <p>Welcome to the Weekly Task Planning Agent! Follow these simple steps to generate your 7-day study and task plan:</p>
            <ol style={{ paddingLeft: "20px" }}>
              <li><strong>Setup &amp; Run:</strong> Unzip the project folder, open a terminal, and run <code>python app.py</code>.</li>
              <li><strong>Access Web App:</strong> Open the local URL printed in your terminal using a web browser.</li>
              <li><strong>Input Details:</strong> Enter your tasks for the upcoming week (including task name, deadline, estimated duration, and importance level: high/medium/low) along with your daily available study time.</li>
            </ol>
          </section>

          {/* 2. Genuine Run Example */}
          <section style={{ marginBottom: "30px", background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <h2 style={{ marginTop: 0, color: "#0366d6", fontSize: "20px" }}>2. Genuine Run Example</h2>
            <p>Below is a genuine example of user input and the corresponding agent scheduling response:</p>
            <div style={{ background: "#f1f8ff", padding: "15px", borderLeft: "4px solid #0366d6", borderRadius: "0 6px 6px 0", margin: "12px 0" }}>
              <p style={{ margin: "0 0 6px 0" }}><strong>User Input:</strong></p>
              <p style={{ margin: 0 }}><em>“Microeconomics assignment (due Day 3, 4 hours estimated duration, High importance), Discrete Mathematics problem set (due Day 5, 3 hours estimated duration, Medium importance). Daily available study time is 4 hours.”</em></p>
            </div>
            <div style={{ background: "#f6f8fa", padding: "15px", borderLeft: "4px solid #28a745", borderRadius: "0 6px 6px 0" }}>
              <p style={{ margin: "0 0 6px 0" }}><strong>Agent Response:</strong></p>
              <p style={{ margin: 0 }}><em>Generated a 7-day schedule: Day 1 prioritizes Microeconomics (2 hours), Day 2 completes Microeconomics (remaining 2 hours), and Day 3 schedules Discrete Mathematics (3 hours). All tasks are planned before their deadlines without exceeding the daily 4-hour limit.</em></p>
            </div>
          </section>

          {/* 3. Concise Result */}
          <section style={{ marginBottom: "30px", background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <h2 style={{ marginTop: 0, color: "#0366d6", fontSize: "20px" }}>3. Concise Result</h2>
            <ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
              <li style={{ marginBottom: "8px" }}><strong>Automated Pipeline:</strong> Successfully implemented an end-to-end pipeline spanning natural language task input, structured JSON parsing, and a deterministic rule-based priority scoring and greedy allocation engine.</li>
              <li><strong>Smart Scheduling:</strong> Performs intelligent prioritization based on a multi-factor scoring formula (urgency, importance, and workload pressure), and automatically triggers an infeasibility report when conflicting constraints arise.</li>
            </ul>
          </section>

          {/* 4. Limitation */}
          <section style={{ marginBottom: "20px", background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <h2 style={{ marginTop: 0, color: "#0366d6", fontSize: "20px" }}>4. Limitation</h2>
            <ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
              <li style={{ marginBottom: "8px" }}><strong>No Automated Website Syncing:</strong> The system cannot automatically connect to university portals or external learning management systems to fetch to-do items; all tasks must be entered manually by the user.</li>
              <li><strong>No Active Reminder Function:</strong> The agent provides a static 7-day schedule output and does not include active push notifications or automated reminders. To receive real-time alerts, the web application must remain open continuously.</li>
            </ul>
          </section>

        </div>
      </div>

    </div>
  );
}
  );
}
