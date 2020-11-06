import { Request, Response, NextFunction } from 'express'
import { verify } from 'jsonwebtoken'
import jwt from '../config/jwt'
import AppError from '../errors/AppError'

interface TokenPayload {
  sub: string
  iat: number
  exp: number
}

export default function ensureAuthenticated(
  req: Request,
  _: Response,
  next: NextFunction,
): void {
  const auth = req.headers.authorization

  if (!auth) throw new AppError('Token not provided', 401)

  const [, token] = auth.split(' ')

  try {
    const { sub: id } = verify(token, jwt.secret) as TokenPayload
    req.user = { id }

    return next()
  } catch {
    throw new AppError('Token is blank or invalid', 401)
  }
}
