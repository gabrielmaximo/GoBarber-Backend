import { getRepository } from 'typeorm'
import { hash } from 'bcryptjs'
import { join } from 'path'
import { promises } from 'fs'

import uploadConfig from '../config/upload'
import User from '../models/Users'
import AppError from '../errors/AppError'

interface CreateRequest {
  name: string
  email: string
  password: string
}

interface AvatarRequest {
  user_id: string
  fileName: string
}

class UserService {
  async store({ name, email, password }: CreateRequest): Promise<User> {
    const userRepository = getRepository(User)

    const checkEmailExists = await userRepository.findOne({
      where: { email },
    })

    if (checkEmailExists)
      throw new AppError('This email already been used', 400)

    const hashedPassword = await hash(password, 8)

    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
    })

    await userRepository.save(user)

    delete user.password

    return user
  }

  async updateAvatar({ user_id, fileName }: AvatarRequest): Promise<string> {
    const usersRepository = getRepository(User)

    const user = await usersRepository.findOne(user_id)

    if (!user)
      throw new AppError('Only authenticated users can change avatar', 401)

    if (user.avatar) {
      const avatarPath = join(uploadConfig.directory, user.avatar)
      promises.unlink(avatarPath)
    }

    user.avatar = fileName

    await usersRepository.save(user)

    return user.avatar
  }
}

export default new UserService()
