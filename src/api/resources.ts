import request from './request'

// ---- Types ----

export interface ResourceListItem {
  id: number
  name: string | null
  code: string | null
  description: string | null
  type: string | null
  httpMethod: string | null
  path: string | null
  icon: string | null
  route: string | null
  isHidden: boolean
  badge: string | null
  permissionCode: string | null
  parentId: number | null
  sortOrder: number
  status: string | null
}

export interface ResourceDetail extends ResourceListItem {
  createdAt: string
  updatedAt: string
}

export interface GetResourceListResult {
  items: ResourceListItem[]
  totalCount: number
}

export interface GetResourceListParams {
  type?: string
  httpMethod?: string
  parentId?: number
  activeOnly?: boolean
}

export interface CreateResourceCommand {
  name: string
  code: string
  description?: string
  type: string
  httpMethod?: string
  path?: string
  icon?: string
  route?: string
  isHidden?: boolean
  badge?: string
  permissionCode?: string
  parentId?: number
  sortOrder?: number
  status?: string
}

export interface UpdateResourceCommand extends CreateResourceCommand {
  id: number
}

export interface ResourceTreeItem extends ResourceListItem {
  children: ResourceTreeItem[] | null
}

export interface GetResourceTreeResult {
  items: ResourceTreeItem[]
}

export interface MoveResourceCommand {
  id: number
  parentId: number | null
}

export interface ResourceResult {
  id: number
  name: string | null
  code: string | null
  description: string | null
  type: string | null
  httpMethod: string | null
  path: string | null
  icon: string | null
  route: string | null
  isHidden: boolean
  badge: string | null
  permissionCode: string | null
  parentId: number | null
  sortOrder: number
  status: string | null
  createdAt: string
  updatedAt: string
}

// ---- API functions ----

/** 获取资源树 */
export function getResourceTree(params?: { type?: string; status?: number }) {
  return request.get<GetResourceTreeResult, GetResourceTreeResult>(
    '/api/system/resources/tree',
    { params },
  )
}

/** 获取资源列表 */
export function getResourceList(params?: GetResourceListParams) {
  return request.get<GetResourceListResult, GetResourceListResult>(
    '/api/system/resources',
    { params },
  )
}

/** 获取单个资源 */
export function getResource(id: number) {
  return request.get<ResourceDetail, ResourceDetail>(
    `/api/system/resources/${id}`,
  )
}

/** 创建资源 */
export function createResource(data: CreateResourceCommand) {
  return request.post<ResourceResult, ResourceResult>(
    '/api/system/resources',
    data,
  )
}

/** 更新资源 */
export function updateResource(data: UpdateResourceCommand) {
  return request.put<ResourceResult, ResourceResult>(
    '/api/system/resources',
    data,
  )
}

/** 删除资源 */
export function deleteResource(id: number) {
  return request.delete<void, void>(`/api/system/resources/${id}`)
}

/** 激活资源 */
export function activateResource(id: number) {
  return request.post<ResourceResult, ResourceResult>(
    `/api/system/resources/${id}/activate`,
  )
}

/** 禁用资源 */
export function disableResource(id: number) {
  return request.post<ResourceResult, ResourceResult>(
    `/api/system/resources/${id}/disable`,
  )
}

/** 移动资源 */
export function moveResource(data: MoveResourceCommand) {
  return request.put<ResourceResult, ResourceResult>(
    `/api/system/resources/${data.id}/move`,
    data,
  )
}
