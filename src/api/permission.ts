import request from './request'

// ---- Types ----

export interface MenuTreeItem {
  id: number
  name: string | null
  code: string | null
  icon: string | null
  route: string | null
  isHidden: boolean
  badge: string | null
  sortOrder: number
  permissionCode: string | null
  children: MenuTreeItem[] | null
}

export interface GetUserMenuResult {
  items: MenuTreeItem[]
}

export interface GetPageApiPermissionsResult {
  permissionCodes: string[]
}

// ---- API functions ----

/** 获取当前用户的菜单树（基于角色拥有的资源） */
export function getUserMenu() {
  return request.get<GetUserMenuResult, GetUserMenuResult>('/api/permission/menus')
}

/** 获取指定页面的 API 权限编码列表 */
export function getPageApiPermissions(pageId: number) {
  return request.get<GetPageApiPermissionsResult, GetPageApiPermissionsResult>(
    `/api/permission/pages/${pageId}/apis`,
  )
}
