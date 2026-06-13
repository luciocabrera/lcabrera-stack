

FROM node:26-alpine AS deps
WORKDIR /app
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Install git (required for some dependencies), then pnpm
RUN apk add --no-cache git && npm install -g pnpm && pnpm config set store-dir /app/.pnpm-store
# Install dependencies using pnpm (works for single-package Vite+ projects)
RUN pnpm install

FROM node:26-alpine AS build
WORKDIR /app
RUN apk add --no-cache git && npm install -g pnpm
ENV NODE_ENV=production
ARG VITE_GA_MEASUREMENT_ID
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
COPY app ./app
COPY config ./config
COPY eslint-local-rules ./eslint-local-rules
COPY public ./public
COPY utils ./utils
COPY .npmrc ./
COPY eslint.config.js ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY react-router.config.ts ./
COPY tsconfig.app.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY --from=deps /app/node_modules ./node_modules
# Clean build: do not copy .pnpm-store
# Build using Vite+ (try plain vp)
RUN npx vp run build || (cat /root/.npm/_logs/*-debug-*.log && false)

FROM node:26-alpine AS runner
WORKDIR /app
RUN apk add --no-cache git \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
RUN chown -R appuser:nodejs /app
USER appuser
EXPOSE 3000
CMD ["npx", "react-router-serve", "./build/server/index.js"]
