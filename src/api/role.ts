import request from './request'

// ---- Types ----

export interface RoleListItem {
  id: number
  name: string | null
  code: string | null
  description: string | null
  status: string | null
  createdAt: string
}

export interface RoleResult {
  id: number
  name: string | null
  code: string | null
  description: string | null
  status: string | null
  createdAt: string
  updatedAt: string
}

export interface GetRoleDetailResult {
  id: number
  name: string | null
  code: string | null
  description: string | null
  status: string | null
  resourceIds: number[] | null
  createdAt: string
  updatedAt: string
}

export interface GetRoleListResult {
  items: RoleListItem[]
  totalCount: number
}

export interface CreateRoleCommand {
  name: string
  code: string
  description?: string
}

export interface UpdateRoleCommand {
  id: number
  name: string
  code: string
  description?: string
}

export interface AssignResourceCommand {
  roleId: number
  resourceIds: number[]
}

// ---- API functions ----

/** 获取角色列表 */
export function getRoleList() {
  return request.get<GetRoleListResult, GetRoleListResult>('/api/role')
}

/** 获取单个角色 */
export function getRole(id: number) {
  return request.get<GetRoleDetailResult, GetRoleDetailResult>(
    `/api/role/${id}`,
  )
}

/** 创建角色 */
export function createRole(data: CreateRoleCommand) {
  return request.post<RoleResult, RoleResult>('/api/role', data)
}

/** 更新角色 */
export function updateRole(id: number, data: UpdateRoleCommand) {
  return request.put<RoleResult, RoleResult>(`/api/role/${id}`, data)
}

/** 删除角色 */
export function deleteRole(id: number) {
  return request.delete<void, void>(`/api/role/${id}`)
}

/** 激活角色 */
export function activateRole(id: number) {
  return request.post<RoleResult, RoleResult>(`/api/role/${id}/activate`)
}

/** 禁用角色 */
export function disableRole(id: number) {
  return request.post<RoleResult, RoleResult>(`/api/role/${id}/disable`)
}

/** 给角色分配资源（覆盖模式） */
export function assignResources(id: number, data: AssignResourceCommand) {
  return request.post<RoleResult, RoleResult>(
    `/api/role/${id}/resources`,
    data,
  )
}

/** 从角色移除资源 */
export function removeResourceFromRole(roleId: number, resourceId: number) {
  return request.delete<void, void>(
    `/api/role/${roleId}/resources/${resourceId}`,
  )
}
