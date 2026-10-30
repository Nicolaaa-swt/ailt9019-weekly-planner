export const chatCopy = {
  en: {
    responseTime: "Response time", seconds: "s",
    savedBeforeFailure: "Calendar changes were saved, but the response was interrupted. Check the current calendar before asking for further edits.",
    title: "Planner assistant", model: "DeepSeek V4.1 Flash · Max + Medium", newChat: "New chat",
    close: "Close AI chat", log: "Chat messages", welcome: "Talk to the agent to further organize your week",
    userMessage: "Your message", assistantMessage: "Assistant message", thinking: "Thinking...",
    input: "Message the assistant", placeholder: "Ask anything…", stop: "Stop response", send: "Send message",
    full: "Conversation full. Select New chat to continue.", open: "AI chat", closeLauncher: "Close chat",
  },
  zh: {
    responseTime: "回覆耗時", seconds: "秒",
    savedBeforeFailure: "日曆變更已儲存，但回覆中斷。請先查看目前日曆，再要求進一步編輯。",
    title: "規劃助理", model: "DeepSeek V4.1 Flash · 最高 + 中等推理", newChat: "新對話",
    close: "關閉 AI 對話", log: "對話訊息", welcome: "與助理對話，進一步規劃你的一週",
    userMessage: "你的訊息", assistantMessage: "助理訊息", thinking: "思考中...",
    input: "傳訊息給助理", placeholder: "輸入你的問題…", stop: "停止回覆", send: "傳送訊息",
    full: "對話已滿，請選擇「新對話」繼續。", open: "AI 對話", closeLauncher: "關閉對話",
  },
  "zh-Hans": {
    responseTime: "回复耗时", seconds: "秒",
    savedBeforeFailure: "日历更改已保存，但回复中断。请先查看当前日历，再要求进一步编辑。",
    title: "规划助手", model: "DeepSeek V4.1 Flash · 最高 + 中等推理", newChat: "新对话",
    close: "关闭 AI 对话", log: "对话消息", welcome: "与助手对话，进一步规划你的一周",
    userMessage: "你的消息", assistantMessage: "助手消息", thinking: "思考中...",
    input: "给助手发消息", placeholder: "输入你的问题…", stop: "停止回复", send: "发送消息",
    full: "对话已满，请选择“新对话”继续。", open: "AI 对话", closeLauncher: "关闭对话",
  },
} as const;

export type ChatLanguage = keyof typeof chatCopy;

export const chatErrors = {
  en: {
    origin: "Request origin is not allowed.",
    invalid: "Invalid calendar or full conversation. Reload the calendar or start a new chat. Messages can contain up to 20,000 characters.",
    configuration: "Chat is not configured. Set API_KEY on the server.",
    access: "The AI provider rejected access. Check the server API key and endpoint.",
    quota: "The AI provider is busy or your quota is exhausted. Try again later.",
    provider: "The AI provider could not complete this request. Try again.",
    length: "The model reached its output limit. Try a shorter question.",
    connection: "The model did not return an answer in time or the connection failed. Please try again.",
    unavailable: "The chat server is unavailable. Please try again.",
    sendFailure: "Could not send your message.", invalidReply: "The model returned an invalid answer.",
    stopped: "Response stopped. Your message is ready to send again.",
  },
  zh: {
    origin: "不允許此來源的請求。",
    invalid: "日曆資料無效或對話已滿。請重新載入日曆或開始新對話。每則訊息最多可輸入 20,000 個字元。",
    configuration: "對話功能尚未設定，請在伺服器設定 API_KEY。",
    access: "AI 服務拒絕存取，請檢查伺服器的 API 金鑰及服務網址。",
    quota: "AI 服務繁忙或配額已用盡，請稍後再試。",
    provider: "AI 服務無法完成此請求，請重試。",
    length: "模型已達輸出上限，請縮短問題後重試。",
    connection: "模型未能及時回覆或連線失敗，請重試。",
    unavailable: "對話伺服器暫時無法使用，請重試。",
    sendFailure: "無法傳送訊息。", invalidReply: "模型傳回了無效的回覆。",
    stopped: "已停止回覆，你可以重新傳送訊息。",
  },
  "zh-Hans": {
    origin: "不允许此来源的请求。",
    invalid: "日历数据无效或对话已满。请重新加载日历或开始新对话。每条消息最多可输入 20,000 个字符。",
    configuration: "对话功能尚未配置，请在服务器设置 API_KEY。",
    access: "AI 服务拒绝访问，请检查服务器的 API 密钥及服务地址。",
    quota: "AI 服务繁忙或配额已用尽，请稍后重试。",
    provider: "AI 服务无法完成此请求，请重试。",
    length: "模型已达输出上限，请缩短问题后重试。",
    connection: "模型未能及时回复或连接失败，请重试。",
    unavailable: "对话服务器暂时不可用，请重试。",
    sendFailure: "无法发送消息。", invalidReply: "模型返回了无效的回复。",
    stopped: "已停止回复，你可以重新发送消息。",
  },
} as const;

export type ChatErrorCode = keyof typeof chatErrors.en;
export function isChatErrorCode(value: unknown): value is ChatErrorCode {
  return typeof value === "string" && Object.hasOwn(chatErrors.en, value);
}
