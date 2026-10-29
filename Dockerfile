FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html qvac.config.json ./
RUN npm ci

COPY server/ ./server/
COPY src/ ./src/

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/qvac.config.json ./qvac.config.json

EXPOSE 3000

CMD ["node", "dist/server/server.js"]
