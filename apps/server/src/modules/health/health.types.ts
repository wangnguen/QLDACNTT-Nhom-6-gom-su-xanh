export type HealthStatus = 'healthy' | 'unhealthy'

export type DatabaseStatus = 'connected' | 'disconnected' | 'error'

export interface UptimeInfo {
  seconds: number
  formatted: string
}

export interface HealthCheck {
  status: HealthStatus
  uptime: UptimeInfo
  database: DatabaseStatus
  timestamp: string
}
