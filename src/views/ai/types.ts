import type { UsageDataResult } from '@/api/ai'

export interface ToolCallInfo {
  id: string
  name: string
  arguments: string
  result?: string
  isRunning: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: number
  displayContent: string
  isStreaming: boolean
  sequenceNumber?: number
  usage?: UsageDataResult
  toolCalls?: ToolCallInfo[]
}
