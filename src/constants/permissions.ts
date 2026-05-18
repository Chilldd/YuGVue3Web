/** 权限编码常量，格式 {控制器小写}:{方法小写} */

export const resource = {
  create: 'resource:create',
  update: 'resource:update',
  delete: 'resource:delete',
  activate: 'resource:activate',
  disable: 'resource:disable',
} as const

export const role = {
  create: 'role:create',
  update: 'role:update',
  delete: 'role:delete',
  activate: 'role:activate',
  disable: 'role:disable',
  assignResources: 'role:assignresources',
  assignUsers: 'role:assignusers',
  viewUsers: 'role:getusers',
} as const

export const user = {
  create: 'user:create',
  delete: 'user:delete',
  activate: 'user:activate',
  disable: 'user:disable',
  resetPassword: 'user:resetpassword',
  setroles: 'user:setroles',
} as const

export const tool = {
  syncApiResources: 'tool:syncapiresources',
} as const

export const ai = {
  chat: 'ai:chat',
} as const
