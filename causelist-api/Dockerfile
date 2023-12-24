FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /api

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi


# 2. Rebuild the source code only when needed
FROM base AS development
WORKDIR /api
COPY --from=deps /api/node_modules ./node_modules
COPY . .

# 3. Rebuild the source code only when needed
FROM development AS builder
WORKDIR /api
RUN yarn build


# 4. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /api

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Optimize later to contain only prod
COPY --from=builder /api/ ./

USER nestjs

EXPOSE 3000

ENV PORT 3000

ENV ADMIN_JS_SKIP_BUNDLE true

CMD node dist/main.js
