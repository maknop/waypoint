# Waypoint

A personal travel journal for tracking food, activities, lodging, and notes by
country / state / city — so you never forget what you loved about a trip.

<img width="1259" height="357" alt="image" src="https://github.com/user-attachments/assets/e11e0853-06c7-40fd-b7ea-92677ab64ac8" />

## Running locally

Two processes, two terminals:

```bash
# terminal 1 — API server (http://localhost:4000)
cd server
npm install
npm run dev

# terminal 2 — web app (http://localhost:5173)
cd client
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the
Express server automatically.

Data is stored in `server/data/waypoint.db` (SQLite, created automatically on
first run, gitignored).

## Running with a container

`Containerfile` builds the client and server, then serves both from a single
Express process. `compose.yaml` wraps that into one command (works with
`podman-compose`, `podman compose`, or `docker compose`):

```bash
podman-compose up -d --build
```

Open http://localhost:4000. The named volume (`waypoint-data`) keeps the
SQLite database across restarts/rebuilds — `podman-compose down` is safe,
`podman-compose down -v` wipes your data. To run it without compose:

```bash
podman build -t waypoint -f Containerfile .
podman run -d --name waypoint -p 4000:4000 -v waypoint-data:/app/data waypoint
```

Swap `podman`/`podman-compose` for `docker`/`docker compose` if that's what
you use — both files are Docker-compatible.

## Authentication

Waypoint requires login, and each account has its own private set of
entries. By default anyone who can reach your instance can register with an
email + password. Set `ALLOWED_EMAILS` to a comma-separated list to restrict
who may register or log in:

```bash
ALLOWED_EMAILS=you@example.com,partner@example.com
```

> If you're upgrading an existing instance from before authentication
> existed, the first person to register becomes the owner of all
> pre-existing entries. Set `ALLOWED_EMAILS` right after that first
> registration if you don't want the instance open to further signups.

### Optional: SSO via OIDC

Set these variables to add a "Continue with ..." button backed by any
standards-compliant OIDC provider (Keycloak, Authentik, Auth0, Okta, Google,
etc.) alongside the password form. If they're unset, only email/password
login is shown.

```bash
OIDC_ISSUER_URL=https://idp.example.com/realms/myrealm
OIDC_CLIENT_ID=waypoint
OIDC_CLIENT_SECRET=changeme
OIDC_REDIRECT_URI=https://waypoint.example.com/api/auth/oidc/callback
OIDC_DISPLAY_NAME=Keycloak
```

Other environment variables: `SESSION_TTL_DAYS` (default `30`) and
`COOKIE_SECURE` (defaults to `true` when `NODE_ENV=production`, set to
`false` if self-hosting over plain HTTP).

## Features

- Add entries for **food, activities, lodging, or notes**, each tied to a
  country/state/city picked from a real bundled geography dataset.
- Mark entries as **favorite**, **want to try**, or **not recommended**, with
  an optional 1–5 star rating, free-form tags, and an optional link.
- Browse everything in a card grid, filter by type/status/search text, or
  drill down through the **location sidebar** (country → state → city) to see
  everything you've logged for a place.
- Stats bar showing total entries, favorites, cities, and countries.

## Project structure

```
client/   React app (UI, location picker, forms)
server/   Express API + SQLite schema/routes
```
