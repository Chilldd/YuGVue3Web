import request from '../request'

export interface MemoryInfo {
  totalMB: number | string
  usedMB: number | string
  availableMB: number | string
  usagePercent: number
}

export interface DiskInfo {
  totalGB: number
  usedGB: number
  availableGB: number
  usagePercent: number
}

export interface ServerInfo {
  hostname: string
  osDescription: string
  osArchitecture: string
  processArchitecture: string
  runtimeVersion: string
  runtimeIdentifier: string
  cpuCores: number
  memory: MemoryInfo
  disk: DiskInfo
  uptime: string
  applicationName: string
  applicationVersion: string
  environment: string
  startTime: string
}

export type HealthStatus = 'Healthy' | 'Degraded' | 'Unhealthy'

export interface ServiceHealth {
  name: string
  status: HealthStatus
  latencyMs: number
  details?: string
}

export interface HealthCheckResult {
  status: HealthStatus
  services: ServiceHealth[]
}

export interface GetStatusResult {
  server: ServerInfo
  health: HealthCheckResult | null
  timestamp: string
}

export interface GetHealthResult {
  status: string
  timestamp: string
}

export interface GetReadyResult {
  status: string
  services: ServiceHealth[]
  timestamp: string
}

export function getStatus(): Promise<GetStatusResult> {
  return request.get('/api/system/status')
}

export function getHealth(): Promise<GetHealthResult> {
  return request.get('/api/system/status/health')
}

export function getReady(): Promise<GetReadyResult> {
  return request.get('/api/system/status/ready')
}
