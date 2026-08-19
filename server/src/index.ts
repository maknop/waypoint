import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { router } from './routes.js'
import { db } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', router)

const publicDir = path.join(__dirname, '..', 'public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const server = app.listen(PORT, () => {
  console.log(`Waypoint listening on http://localhost:${PORT}`)
})

// Node ignores SIGTERM by default when running as container PID 1, so
// shutdown must be handled explicitly to stop promptly (e.g. `podman stop`).
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close(() => {
      db.close()
      process.exit(0)
    })
  })
}
