# Production build of the Next.js front-end, served by `next start`.
FROM node:22-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
# Values inlined into the client bundle at build time.
ARG NEXT_PUBLIC_REONIX_URL=""
ARG NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=""
ARG NEXT_PUBLIC_MAP_STYLE=""
ARG NEXT_PUBLIC_MAP_SATELLITE_URL=""
ARG NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION=""
ENV NEXT_PUBLIC_REONIX_URL=$NEXT_PUBLIC_REONIX_URL
ENV NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY
ENV NEXT_PUBLIC_MAP_STYLE=$NEXT_PUBLIC_MAP_STYLE
ENV NEXT_PUBLIC_MAP_SATELLITE_URL=$NEXT_PUBLIC_MAP_SATELLITE_URL
ENV NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION=$NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p /app/.next/cache && chown -R node:node /app

USER node
EXPOSE 3000
CMD ["node", "server.js"]
