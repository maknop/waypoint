import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { router } from './routes.js'
import { authRouter } from './auth/routes.js'
import { requireAuth } from './auth/sessions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/auth', authRouter)
  app.use('/api', requireAuth, router)

  const publicDir = path.join(__dirname, '..', 'public')
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir))
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'))
    })
  }

  return app
}
