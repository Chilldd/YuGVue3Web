import request from '../request'
import type { UserListItem } from './user'

// ---- Types ----

export interface RoleListItem {
  id: string
  name: string | null
  code: string | null
  description: string | null
  status: string | null
  createdAt: string
}

export interface RoleResult {
  id: string
  name: string | null
  code: string | null
  description: string | null
  status: string | null
  createdAt: string
  updatedAt: string
}

export interface GetRoleDetailResult {
  id: string
  name: string | null
  code: string | null
  description: string | null
  status: string | null
  resourceIds: string[] | null
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
  id: string
  name: string
  code: string
  description?: string
}

export interface AssignResourceCommand {
  roleId: string
  resourceIds: string[]
}

// ---- API functions ----

/** 获取角色列表 */
export function getRoleList() {
  return request.get<GetRoleListResult, GetRoleListResult>('/api/system/role')
}

/** 获取单个角色 */
export function getRole(id: string) {
  return request.get<GetRoleDetailResult, GetRoleDetailResult>(
    `/api/system/role/${id}`,
  )
}

/** 创建角色 */
export function createRole(data: CreateRoleCommand) {
  return request.post<RoleResult, RoleResult>('/api/system/role', data)
}

/** 更新角色 */
export function updateRole(id: string, data: UpdateRoleCommand) {
  return request.put<RoleResult, RoleResult>(`/api/system/role/${id}`, data)
}

/** 删除角色 */
export function deleteRole(id: string) {
  return request.delete<void, void>(`/api/system/role/${id}`)
}

/** 激活角色 */
export function activateRole(id: string) {
  return request.post<RoleResult, RoleResult>(`/api/system/role/${id}/activate`)
}

/** 禁用角色 */
export function disableRole(id: string) {
  return request.post<RoleResult, RoleResult>(`/api/system/role/${id}/disable`)
}

/** 给角色分配资源（覆盖模式） */
export function assignResources(id: string, data: AssignResourceCommand) {
  return request.post<RoleResult, RoleResult>(
    `/api/system/role/${id}/resources`,
    data,
  )
}

/** 从角色移除资源 */
export function removeResourceFromRole(roleId: string, resourceId: string) {
  return request.delete<void, void>(
    `/api/system/role/${roleId}/resources/${resourceId}`,
  )
}

// ---- 角色关联用户 ----

export interface GetRoleUsersResult {
  items: UserListItem[]
}

export interface AssignRoleUsersCommand {
  roleId: string
  userIds: string[]
}

/** 获取角色关联的用户列表 */
export function getRoleUsers(id: string) {
  return request.get<GetRoleUsersResult, GetRoleUsersResult>(
    `/api/system/role/${id}/users`,
  )
}

/** 给角色分配用户（追加模式，已有用户跳过） */
export function assignRoleUsers(data: AssignRoleUsersCommand) {
  return request.post<void, void>(
    `/api/system/role/${data.roleId}/users`,
    data,
  )
}

export interface RemoveRoleUsersCommand {
  roleId: string
  userIds: string[]
}

/** 从角色移除用户 */
export function removeRoleUsers(data: RemoveRoleUsersCommand) {
  return request.delete<void, void>(
    `/api/system/user/roles/${data.roleId}`,
    { data: { userIds: data.userIds } },
  )
}
