import { Request, Response, NextFunction } from 'express'
import AppError from './AppError'

export default (
  err: Error,
  req: Request,
  res: Response,
  _: NextFunction,
): Response<AppError> => {
  if (err instanceof AppError)
    return res.status(err.statusCode).json({
      status: `ApplicationError`,
      message: err.message,
    })

  return res.status(500).json({
    status: err.name,
    message:
      process.env.NODE_ENV === 'development'
        ? err.stack?.split('\n')[0]
        : 'Internal Server Error',
  })
}
