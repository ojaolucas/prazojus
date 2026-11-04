# Stage 1: Build da aplicação React / Vite
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# Stage 2: Runtime unificado Node.js (API Backend + Servidor de SPA)
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
RUN npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

EXPOSE 80
ENV PORT=80

CMD ["npx", "tsx", "server/index.ts"]
