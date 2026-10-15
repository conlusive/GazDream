# syntax=docker/dockerfile:1

# ---- dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public address of the site (used for canonical links, sitemap and structured data).
ARG SITE_URL=http://localhost:3000
ENV NEXT_TELEMETRY_DISABLED=1 \
    SITE_URL=$SITE_URL
RUN npm run build

# ---- run
FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PGLITE_DIR=/data/pglite \
    LEADS_LOG_FILE=/data/leads.jsonl
# Without DATABASE_URL an embedded database and the lead fallback log live on the mounted volume.
RUN addgroup -S app && adduser -S app -G app && mkdir -p /data && chown app:app /data
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/pl >/dev/null || exit 1
CMD ["node", "server.js"]
