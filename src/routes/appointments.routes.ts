import { Router } from 'express'
import { getCustomRepository } from 'typeorm'
import { parseISO } from 'date-fns'

import AppointmentsRepository from '../repositories/AppointmentsRepository'
import appointmentService from '../services/AppointmentService'
import ensureAuthenticated from '../middlewares/ensureAuthenticated'

const appointmentsRouter = Router()

appointmentsRouter.use(ensureAuthenticated)

appointmentsRouter.get('/', async (_, res) => {
  const appointmentsRepository = getCustomRepository(AppointmentsRepository)

  return res.json(await appointmentsRepository.find())
})

appointmentsRouter.post('/', async (req, res) => {
  const { provider_id, date } = req.body

  const parseDate = parseISO(date)

  return res.json(
    await appointmentService.store({ provider_id, date: parseDate }),
  )
})

export default appointmentsRouter
