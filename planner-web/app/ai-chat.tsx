"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { chatCopy, chatErrors, isChatErrorCode, type ChatErrorCode, type ChatLanguage } from "./chat-copy";
import { parseChatCalendar, type ChatCalendar } from "./chat-calendar";
import { executeStoredCalendarTool, validSteps, type ToolStep } from "./calendar-tools";

type Message = { role: "user" | "assistant"; content: string; elapsedMs?: number };

export default function AIChat({ calendar, language }: { calendar: ChatCalendar; language: ChatLanguage }) {
  const t = chatCopy[language];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ChatErrorCode | "">("");
  const controller = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open, busy]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [messages, busy, error, open]);
  useEffect(() => () => controller.current?.abort(), []);

  function close() { setOpen(false); launcher.current?.focus(); }
  async function send(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || busy || controller.current) return;
    const startedAt = performance.now();
    const history: Message[] = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    setError("");
    setBusy(true);
    const pending = new AbortController();
    controller.current = pending;
    let appliedChanges = 0;
    try {
      const steps: ToolStep[] = [];
      let checked = false;
      function currentCalendar() {
        return parseChatCalendar({ ...calendar, entries: JSON.parse(localStorage.getItem("weekspace-entries") || "[]") });
      }
      let snapshot = currentCalendar();
      for (let round = 0; round <= 10; round++) {
        const response = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), calendar: snapshot, steps }), signal: pending.signal,
        });
        const result = await response.json().catch(() => { throw new Error("unavailable"); });
        if (pending.signal.aborted) throw new Error("stopped");
        if (!response.ok) throw new Error(isChatErrorCode(result.code) ? result.code : "sendFailure");
        if (result.assistant) {
          const assistant = result.assistant as ToolStep["assistant"];
          const probe: ToolStep = { assistant, results: assistant.tool_calls?.map(call => ({ role: "tool", tool_call_id: call.id, content: "{}" })) };
          if (!validSteps([probe])) throw new Error("invalidReply");
          const call = assistant.tool_calls[0];
          let output: object;
          try {
            const executed = executeStoredCalendarTool(localStorage, snapshot, call, checked);
            if (executed.changed) {
              appliedChanges++;
              window.dispatchEvent(new Event("planner-preferences"));
            }
            if (call.function.name === "get_calendar") checked = true;
            snapshot = executed.calendar;
            output = executed.result;
          } catch (cause) {
            checked = false;
            output = { success: false, error: cause instanceof Error ? cause.message : "Calendar edit failed. No change saved." };
            snapshot = currentCalendar();
          }
          steps.push({ assistant, results: [{ role: "tool", tool_call_id: call.id, content: JSON.stringify(output) }] });
          continue;
        }
        if (typeof result.reply !== "string") throw new Error("invalidReply");
        setMessages([...history, { role: "assistant", content: result.reply, elapsedMs: performance.now() - startedAt }]);
        return;
      }
      throw new Error("invalidReply");
    } catch (cause) {
      setMessages(appliedChanges ? [...history, { role: "assistant", content: t.savedBeforeFailure, elapsedMs: performance.now() - startedAt }] : history.slice(0, -1));
      setInput(appliedChanges ? "" : content);
      setError(appliedChanges ? "" : pending.signal.aborted ? "stopped" : cause instanceof Error && isChatErrorCode(cause.message) ? cause.message : "connection");
    } finally {
      controller.current = null;
      setBusy(false);
    }
  }

  return <div className="ai-chat" lang={language === "zh" ? "zh-Hant" : language}>
    {open && <section id="ai-chat-panel" className="ai-chat-panel" role="dialog" aria-modal="false" aria-labelledby="ai-chat-title" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
      <header className="ai-chat-header">
        <div><h2 id="ai-chat-title">{t.title}</h2><p>{t.model}</p></div>
        <div className="ai-chat-actions">
          <button type="button" disabled={busy} onClick={() => { setMessages([]); setError(""); setInput(""); inputRef.current?.focus(); }}>{t.newChat}</button>
          <button type="button" onClick={close} aria-label={t.close}>×</button>
        </div>
      </header>
      <div className="ai-chat-log" ref={log} role="log" aria-label={t.log} aria-live="polite" aria-relevant="additions">
        {messages.length === 0 && <div className="ai-chat-welcome"><p>{t.welcome}</p></div>}
        {messages.map((message, index) => <div key={index} className={`ai-chat-message ${message.role}`} aria-label={message.role === "user" ? t.userMessage : t.assistantMessage}><p>{message.content}</p>{message.role === "assistant" && message.elapsedMs !== undefined && <small className="ai-chat-response-time">{t.responseTime}: {new Intl.NumberFormat(language === "zh" ? "zh-Hant-HK" : language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(message.elapsedMs / 1000)} {t.seconds}</small>}</div>)}
        {busy && <p className="ai-chat-thinking" role="status">{t.thinking}</p>}
        {error && <p className="ai-chat-error" role="alert">{chatErrors[language][error]}</p>}
      </div>
      <form className="ai-chat-compose" onSubmit={send}>
        <label className="sr-only" htmlFor="ai-chat-input">{t.input}</label>
        <input type="text" id="ai-chat-input" ref={inputRef} value={input} onChange={event => setInput(event.target.value)} disabled={busy} maxLength={20_000} placeholder={t.placeholder} onKeyDown={event => { if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault(); }} />
        {busy ? <button type="button" aria-label={t.stop} title={t.stop} onClick={() => controller.current?.abort()}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg></button> : <button type="submit" aria-label={t.send} title={t.send} disabled={!input.trim() || messages.length >= 40}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" /></svg></button>}
      </form>
      {messages.length >= 40 && <p className="ai-chat-thinking">{t.full}</p>}
    </section>}
    <button ref={launcher} className="ai-chat-launcher" type="button" aria-expanded={open} aria-controls={open ? "ai-chat-panel" : undefined} aria-haspopup="dialog" onClick={() => open ? close() : setOpen(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9.5 9.5 0 0 1 19 0Z" /><path d="M7 9h10M7 13h7" /></svg>{open ? t.closeLauncher : t.open}</button>
  </div>;
}
