import { Router } from 'express'
import { z } from 'zod/v4'

import { validateBody, validateParam, validateQuery } from '@common/middlewares'
import Auth from '@common/middlewares/auth.middleware'
import { idParamSchema } from '@common/validators'

import { RegistrationBody, RegistrationStatusBody, WorkshopBody } from './workshop.schema'
import Service from './workshop.service'

export const publicWorkshopRoute = Router()
publicWorkshopRoute.get('/', async (_req, res) => res.ok(await Service.list()))
publicWorkshopRoute.post(
  '/:id/registrations',
  Auth.authenticate,
  validateParam(idParamSchema),
  validateBody(RegistrationBody),
  async (req, res) => res.ok(await Service.register(req.params.id as string, req.user!.id, req.body.seats))
)

export const adminWorkshopRoute = Router()
adminWorkshopRoute.get('/', async (_req, res) => res.ok(await Service.list(true)))
adminWorkshopRoute.post('/', validateBody(WorkshopBody), async (req, res) =>
  res.created(await Service.create(req.body))
)
adminWorkshopRoute.patch('/:id', validateParam(idParamSchema), validateBody(WorkshopBody), async (req, res) =>
  res.ok(await Service.update(req.params.id as string, req.body))
)

export const adminRegistrationRoute = Router()
const filters = z.object({
  workshopId: z.uuid().optional(),
  search: z.string().max(100).optional(),
  status: z.enum(['confirmed', 'cancelled']).optional()
})
adminRegistrationRoute.get('/', validateQuery(filters), async (req, res) => {
  const q = filters.parse(req.query)
  return res.ok(await Service.registrations(q.workshopId, q.search, q.status))
})
adminRegistrationRoute.patch(
  '/:id',
  validateParam(idParamSchema),
  validateBody(RegistrationStatusBody),
  async (req, res) => res.ok(await Service.cancel(req.params.id as string))
)
