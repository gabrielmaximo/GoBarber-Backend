import { Router } from 'express'

import sessionService from '../services/SessionService'

const sessionsRouter = Router()

sessionsRouter.post('/', async (req, res) => {
  const { email, password } = req.body

  const session = await sessionService.store({ email, password })

  return res.json(session)
})

export default sessionsRouter
