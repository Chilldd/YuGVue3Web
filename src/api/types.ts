/** 统一 API 响应格式 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  errors: Record<string, string[]> | null
}

/** 统一分页结果类型 */
export interface PageResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/** 统一分页请求参数 */
export interface PageParams {
  page?: number
  pageSize?: number
}
