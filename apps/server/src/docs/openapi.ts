import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

import { registry } from './registry'
import './extend-zod'

import './schemas/auth.schema'
import './schemas/user.schema'

export function buildOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Gốm Sứ Xanh API',
      version: '1.0.0',
      description: 'REST API cho trang client và trang admin Gốm Sứ Xanh.'
    },
    servers: [{ url: '/api/v1', description: 'API v1' }]
  })
}
