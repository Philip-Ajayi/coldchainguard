FROM node:22-alpine AS builder

WORKDIR /app

# Install native compilation dependencies required by better-sqlite3 on Alpine (musl)
RUN apk add --no-cache python3 make g++

COPY package*.json tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html qvac.config.json ./
RUN npm install

COPY server/ ./server/
COPY src/ ./src/

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime build dependencies for better-sqlite3 rebuild if needed
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/qvac.config.json ./qvac.config.json

EXPOSE 3000

CMD ["node", "dist/server/server.js"]