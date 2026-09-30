# syntax=docker/dockerfile:1

# ---- build the React client ----
FROM node:26-slim AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- build the API server ----
FROM node:26-slim AS server-build
WORKDIR /app/server
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ---- runtime: one process serves the API and the built client ----
FROM node:26-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev \
  && apt-get purge -y --auto-remove python3 make g++

COPY --from=server-build /app/server/dist ./dist
COPY --from=client-build /app/client/dist ./public

ENV PORT=4000
ENV DATA_DIR=/app/data
VOLUME ["/app/data"]
EXPOSE 4000

CMD ["node", "dist/index.js"]
