import { createApp } from './app.js'
import { authConfig } from './auth/config.js'
import { db } from './db.js'

const app = createApp()

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const server = app.listen(PORT, () => {
  console.log(`Waypoint listening on http://localhost:${PORT}`)
  console.log(`OIDC SSO: ${authConfig.oidc ? `enabled (${authConfig.oidc.issuerUrl})` : 'disabled'}`)
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
