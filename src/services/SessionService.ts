import { getRepository } from 'typeorm'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

import User from '../models/Users'
import jwt from '../config/jwt'
import AppError from '../errors/AppError'

interface Request {
  email: string
  password: string
}

interface Session {
  user: User
  token: string
}

class SessionService {
  async store({ email, password }: Request): Promise<Session> {
    const usersRepository = getRepository(User)
    const exception = new AppError('Invalid email/password combination', 401)

    const user = await usersRepository.findOne({ where: { email } })

    if (!user) throw exception

    const passwordMatched = await compare(password, user.password)

    if (!passwordMatched) throw exception

    const { secret, algorithm, expiresIn } = jwt

    const token = sign({}, secret, { subject: user.id, expiresIn, algorithm })

    delete user.password

    return {
      user,
      token,
    }
  }
}

export default new SessionService()
