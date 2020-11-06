import 'reflect-metadata'

import express from 'express'
import 'express-async-errors'

import './database'
import routes from './routes'
import uploadConfig from './config/upload'
import ExceptionsHandler from './errors/ExceptionsHandler'

const app = express()

app.use(express.json())
app.use('/images', express.static(uploadConfig.directory))
app.use(routes)
app.use(ExceptionsHandler)

app.listen(3333, () => console.log('⭕ Server ON in port 3333 ✅'))
