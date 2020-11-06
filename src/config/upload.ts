import multer from 'multer'
import { resolve } from 'path'
import { randomBytes } from 'crypto'

const tmpFolder = resolve(__dirname, '..', '..', 'tmp')

export default {
  directory: tmpFolder as string,
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(req, file, cb) {
      const hash = randomBytes(8).toString('HEX')
      const fileName = `${hash}${new Date().getTime()}-${file.originalname}`
      return cb(null, fileName)
    },
  }),
} as multer.Options & { directory: string }
