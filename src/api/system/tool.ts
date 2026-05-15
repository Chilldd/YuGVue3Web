import request from '@/api/request'

export interface ToolResult {
  success: boolean
  message?: string
}

export function syncApiResources(): Promise<ToolResult> {
  return request.post<ToolResult, ToolResult>('/api/tool/sync-api-resources')
}
