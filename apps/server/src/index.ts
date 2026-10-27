import 'dotenv/config'

import env from '@common/config/env'
import logger from '@common/config/logger'

import AppDataSource from '@databases/data-source'

import app from './app'

const bootstrap = async () => {
  await AppDataSource.connect()

  const server = app.listen(env.PORT, () => {
    logger.info(`Server is running on http://localhost:${env.PORT}`)
    if (env.ENABLE_DOCS) logger.info(`API docs: http://localhost:${env.PORT}/docs`)
  })

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`)

    server.close(async () => {
      try {
        const dataSource = AppDataSource.getDataSource()
        if (dataSource.isInitialized) {
          await dataSource.destroy()
          logger.info('Database connection closed')
        }
      } catch (err) {
        logger.error(err, 'Error closing database connection')
      }
      logger.info('Server closed')
      process.exit(0)
    })

    setTimeout(() => {
      logger.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10_000)
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Failed to start server')
  process.exit(1)
})
