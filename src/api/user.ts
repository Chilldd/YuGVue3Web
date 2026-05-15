import request from './request'

// ---- Types ----

export interface UserListItem {
  id: number
  username: string
  status: string
  createdAt: string
}

export interface GetUserListResult {
  items: UserListItem[]
  totalCount: number
  page: number
  pageSize: number
}

export interface GetUserResult {
  id: number
  username: string
  status: string
  roleIds: number[] | null
  createdAt: string
  updatedAt: string
}

export interface CreateUserCommand {
  username: string
  password: string
}

export interface UserResult {
  id: number
  username: string
  createdAt: string
}

export interface SetUserRolesCommand {
  userId: number
  roleIds: number[]
}

// ---- API functions ----

/** 获取用户列表 */
export function getUserList() {
  return request.get<GetUserListResult, GetUserListResult>('/api/system/user')
}

/** 获取单个用户 */
export function getUser(id: number) {
  return request.get<GetUserResult, GetUserResult>(`/api/system/user/${id}`)
}

/** 创建用户 */
export function createUser(data: CreateUserCommand) {
  return request.post<UserResult, UserResult>('/api/system/user', data)
}

/** 删除用户 */
export function deleteUser(id: number) {
  return request.delete<void, void>(`/api/system/user/${id}`)
}

/** 启用用户 */
export function activateUser(id: number) {
  return request.post<UserResult, UserResult>(`/api/system/user/${id}/activate`)
}

/** 禁用用户 */
export function disableUser(id: number) {
  return request.post<UserResult, UserResult>(`/api/system/user/${id}/disable`)
}

/** 设置用户角色（覆盖模式） */
export function setUserRoles(data: SetUserRolesCommand) {
  return request.put<void, void>(`/api/system/user/${data.userId}/roles`, data)
}
