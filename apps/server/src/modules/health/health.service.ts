import AppDataSource from '@databases/data-source'

import type { DatabaseStatus, HealthCheck } from './health.types'

class HealthService {
  static async getHealthStatus(): Promise<HealthCheck> {
    const uptime = process.uptime()
    const dataSource = AppDataSource.getDataSource()

    let dbStatus: DatabaseStatus = 'disconnected'
    try {
      if (dataSource.isInitialized) {
        await Promise.race([
          dataSource.query('SELECT 1'),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ])
        dbStatus = 'connected'
      }
    } catch {
      dbStatus = 'error'
    }

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      uptime: {
        seconds: Math.floor(uptime),
        formatted: HealthService.formatUptime(uptime)
      },
      database: dbStatus,
      timestamp: new Date().toISOString()
    }
  }

  private static formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    const parts = []
    if (d > 0) parts.push(`${d}d`)
    if (h > 0) parts.push(`${h}h`)
    if (m > 0) parts.push(`${m}m`)
    parts.push(`${s}s`)

    return parts.join(' ')
  }
}

export default HealthService
