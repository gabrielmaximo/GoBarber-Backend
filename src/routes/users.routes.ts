import { Router } from 'express'
import multer from 'multer'
import uploadConfig from '../config/upload'

import userService from '../services/UserService'
import ensureAuthenticated from '../middlewares/ensureAuthenticated'

const usersRouter = Router()
const upload = multer(uploadConfig)

usersRouter.post('/', async (req, res) => {
  const { name, email, password } = req.body

  const user = await userService.store({ name, email, password })

  return res.json(user)
})

usersRouter.use(ensureAuthenticated)

usersRouter.patch('/avatar', upload.single('avatar'), async (req, res) => {
  const avatar = await userService.updateAvatar({
    user_id: req.user.id,
    fileName: req.file.filename,
  })

  return res.json({ avatar })
})

export default usersRouter
