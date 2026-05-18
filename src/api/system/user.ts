import request from '../request'
import type { PageResult, PageParams } from '../types'

// ---- Types ----

export interface UserListItem {
  id: string
  username: string
  status: string
  createdAt: string
}

export type GetUserListResult = PageResult<UserListItem>

export interface GetUserResult {
  id: string
  username: string
  status: string
  roleIds: string[] | null
  createdAt: string
  updatedAt: string
}

export interface CreateUserCommand {
  username: string
  password: string
}

export interface UserResult {
  id: string
  username: string
  createdAt: string
}

export interface SetUserRolesCommand {
  userId: string
  roleIds: string[]
}

// ---- API functions ----

/** 获取用户列表 */
export function getUserList(params?: PageParams) {
  return request.get<GetUserListResult, GetUserListResult>('/api/system/user', { params })
}

/** 获取单个用户 */
export function getUser(id: string) {
  return request.get<GetUserResult, GetUserResult>(`/api/system/user/${id}`)
}

/** 创建用户 */
export function createUser(data: CreateUserCommand) {
  return request.post<UserResult, UserResult>('/api/system/user', data)
}

/** 删除用户 */
export function deleteUser(id: string) {
  return request.delete<void, void>(`/api/system/user/${id}`)
}

/** 启用用户 */
export function activateUser(id: string) {
  return request.post<UserResult, UserResult>(`/api/system/user/${id}/activate`)
}

/** 禁用用户 */
export function disableUser(id: string) {
  return request.post<UserResult, UserResult>(`/api/system/user/${id}/disable`)
}

/** 设置用户角色（覆盖模式） */
export function setUserRoles(data: SetUserRolesCommand) {
  return request.put<void, void>(`/api/system/user/${data.userId}/roles`, data)
}

/** 重置用户密码（密码重置为 123456，所有会话强制登出） */
export function resetPassword(id: string) {
  return request.post<UserResult, UserResult>(`/api/system/user/${id}/reset-password`)
}
