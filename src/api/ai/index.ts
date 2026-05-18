import request from '@/api/request'

/** 发送聊天消息请求参数 */
export interface SendChatMessageCommand {
  message: string
  sessionId?: string
}

/** 流式聊天请求参数 */
export interface StreamChatCommand {
  message: string
  sessionId?: string
}

/** 聊天响应 */
export interface ChatMessageResult {
  reply: string
  sessionId: string
  model: string
}

/** 工具调用数据 */
export interface ToolCallData {
  id: string
  name: string
  arguments: string
}

/** 工具调用结果数据 */
export interface ToolResultData {
  id: string
  name: string
  content: string
}

/** SSE 增量数据 */
export interface ChatStreamDelta {
  type: 'delta' | 'usage' | 'tool_call' | 'tool_result' | 'done'
  content: string
  usage?: UsageDataResult
  toolCall?: ToolCallData
  toolResult?: ToolResultData
  sessionId?: string
}

/** Token 用量数据 */
export interface UsageDataResult {
  inTokens: number
  outTokens: number
  totalTokens: number
  promptCacheHitTokens: number | null
  promptCacheMissTokens: number | null
}

/** 发送聊天消息（非流式） */
export function sendChatMessage(data: SendChatMessageCommand): Promise<ChatMessageResult> {
  return request.post('/api/AI', data)
}

// ---- 会话管理 ----

/** 会话列表项 */
export interface SessionListItem {
  sessionId: string
  title: string
  lastActiveAt?: string
}

/** 获取会话列表结果 */
export interface GetSessionListResult {
  items: SessionListItem[]
}

/** 获取当前用户的会话列表（后端直接返回裸数组） */
export function getSessionList(): Promise<SessionListItem[]> {
  return request.get('/api/AI/sessions')
}

/** 删除指定会话 */
export function deleteSession(sessionId: string): Promise<void> {
  return request.delete(`/api/AI/sessions/${sessionId}`)
}

/** 重命名会话请求参数 */
export interface RenameSessionCommand {
  sessionId: string
  title: string
}

/** 重命名会话 */
export function renameSession(sessionId: string, title: string): Promise<void> {
  return request.put(`/api/AI/sessions/${sessionId}/rename`, { sessionId, title })
}

// ---- 消息历史 ----

/** 历史消息项 */
export interface MessageItem {
  role: string
  content: string
  sequenceNumber: number
  tokenCount: number | null
  createdAt: string
  toolCallId?: string | null
  toolCalls?: string | null
}

/** 获取会话消息历史结果 */
export interface GetSessionMessagesResult {
  items: MessageItem[] | null
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/** 获取会话消息历史（倒序分页，page=1 为最新） */
export function getSessionMessages(
  sessionId: string,
  page = 1,
  pageSize = 20,
): Promise<GetSessionMessagesResult> {
  return request.get(`/api/AI/sessions/${sessionId}/messages`, {
    params: { page, pageSize },
  })
}

/** SSE 流式聊天回调参数 */
export interface StreamCallbacks {
  onDelta: (content: string) => void
  onToolCall: (toolCall: ToolCallData) => void
  onToolResult: (toolResult: ToolResultData) => void
  onUsage: (usage: UsageDataResult) => void
  onError: (error: Error) => void
  onComplete: (sessionId?: string) => void
}

/** 发送流式聊天消息（SSE），返回 Promise 以便调用方使用 finally */
export function sendChatMessageStream(
  data: StreamChatCommand,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseURL.replace(/\/+$/, '')}/api/AI/stream`
  const token = localStorage.getItem('accessToken')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const cancelled = { value: false }
  let completed = false

  if (signal) {
    signal.addEventListener('abort', () => {
      cancelled.value = true
    })
  }

  return fetch(url, { method: 'POST', headers, body: JSON.stringify(data), signal })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalSessionId: string | undefined

      while (true) {
        if (cancelled.value) break

        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          try {
            const json = trimmed.slice(6)
            const delta: ChatStreamDelta = JSON.parse(json)

            if (delta.type === 'delta') {
              callbacks.onDelta(delta.content)
            } else if (delta.type === 'tool_call' && delta.toolCall) {
              callbacks.onToolCall(delta.toolCall)
            } else if (delta.type === 'tool_result' && delta.toolResult) {
              callbacks.onToolResult(delta.toolResult)
            } else if (delta.type === 'usage' && delta.usage) {
              callbacks.onUsage(delta.usage)
            } else if (delta.type === 'done') {
              finalSessionId = delta.sessionId
            }
          } catch {
            // 跳过无法解析的事件
          }
        }
      }

      if (!cancelled.value) {
        completed = true
        callbacks.onComplete(finalSessionId)
      }
    })
    .catch((err) => {
      if (!cancelled.value && !completed) {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)))
      }
    })
}
