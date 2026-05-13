import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface UserInfo {
  userId: string
  username: string
}

export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

/** 登录 */
export function login(params: LoginParams) {
  return request.post<LoginResult, LoginResult>('/api/Auth/login', params)
}

/** 刷新令牌 */
export function refreshToken(refreshToken: string) {
  return request.post<RefreshTokenResult, RefreshTokenResult>('/api/Auth/refresh', { refreshToken })
}

/** 获取当前用户信息 */
export function getUserInfo() {
  return request.get<UserInfo, UserInfo>('/api/Weather/me')
}

/** 退出登录 */
export function logoutApi(refreshToken: string) {
  return request.post<void, void>('/api/Auth/logout', { refreshToken })
}
