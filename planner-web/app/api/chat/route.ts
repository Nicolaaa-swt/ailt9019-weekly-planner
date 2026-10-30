import { calendarTools, validSteps, type ToolStep } from "../../calendar-tools.ts";
import { chatErrors, type ChatErrorCode } from "../../chat-copy.ts";
import { calendarSystemPrompt, parseChatCalendar, type ChatCalendar } from "../../chat-calendar.ts";

export const maxDuration = 180;

function chatError(code: ChatErrorCode, status: number) {
  return Response.json({ code, error: chatErrors.en[code] }, { status });
}

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return chatError("origin", 403);
  }
  let messages: Message[];
  let calendar: ChatCalendar;
  let steps: ToolStep[];
  try {
    const body = await request.text();
    if (body.length > 1_000_000) throw new Error();
    const parsed = JSON.parse(body);
    messages = parsed.messages;
    steps = parsed.steps ?? [];
    if (!validSteps(steps)) throw new Error();
    calendar = parseChatCalendar(parsed.calendar);
    if (!Array.isArray(messages) || !messages.length || messages.length > 40 ||
      messages.some((message, index) => !message ||
        message.role !== (index % 2 === 0 ? "user" : "assistant") ||
        typeof message.content !== "string" || !message.content.trim() || message.content.length > 20_000) ||
      messages.at(-1)?.role !== "user" || JSON.stringify(messages).length > 100_000) throw new Error();
    messages = messages.map(({ role, content }) => ({ role, content }));
  } catch {
    return chatError("invalid", 400);
  }
  const key = process.env.API_KEY;
  if (!key) return chatError("configuration", 503);
  const baseURL = process.env.AI_BASE_URL || "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1";
  try {
    const upstream = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-v4.1-flash",
        reasoning_effort: steps.length === 0 ? "max" : "medium",
        messages: [{ role: "system", content: calendarSystemPrompt(calendar) }, ...messages, ...steps.flatMap(step => [step.assistant, ...step.results])],
        tools: calendarTools,
        parallel_tool_calls: false,
        tool_choice: steps.length >= 10 ? "none" : "auto",
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(175_000)]),
      cache: "no-store",
    });
    if (!upstream.ok) {
      const code = upstream.status === 401 || upstream.status === 403
        ? "access"
        : upstream.status === 429 ? "quota"
        : "provider";
      return chatError(code, 502);
    }
    const result = await upstream.json();
    const choice = result.choices?.[0];
    if (choice?.finish_reason === "length") {
      return chatError("length", 502);
    }
    const assistant = choice?.message;
    if (assistant?.tool_calls?.length) {
      const turn = { role: "assistant" as const, content: typeof assistant.content === "string" ? assistant.content : null,
        ...(typeof assistant.reasoning_content === "string" ? { reasoning_content: assistant.reasoning_content } : {}),
        tool_calls: assistant.tool_calls };
      const probe = { assistant: turn, results: turn.tool_calls.map((call: { id: string }) => ({ role: "tool", tool_call_id: call.id, content: "{}" })) };
      if (!validSteps([probe]) || steps.length >= 10) throw new Error("Invalid tool call");
      return Response.json({ assistant: turn }, { headers: { "Cache-Control": "no-store" } });
    }
    const reply = assistant?.content;
    if (typeof reply !== "string" || !reply.trim()) throw new Error();
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return chatError("connection", 502);
  }
}
