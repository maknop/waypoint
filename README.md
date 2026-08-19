# Waypoint

A personal travel journal for tracking food, activities, lodging, and notes by
country / state / city — so you never forget what you loved about a trip.

- **Client**: React + TypeScript + Vite + Tailwind CSS
- **Server**: Express + SQLite (`better-sqlite3`), REST API
- **Locations**: bundled country/state/city data (`country-state-city`), no external API calls

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
