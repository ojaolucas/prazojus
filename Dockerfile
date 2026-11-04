# Stage 1: Build da aplicação React/Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copia definições de pacotes primeiro para cache inteligente de camadas
COPY package.json package-lock.json* ./

RUN npm ci || npm install

# Copia o código-fonte
COPY . .

# Executa o build de produção (tsc -b && vite build)
RUN npm run build

# Stage 2: Servidor Web Nginx ultra-leve
FROM nginx:alpine

# Remove configuração padrão
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia configuração otimizada do Nginx (SPA + Gzip + Cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os artefatos compilados da etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80 para o proxy reverso do Dokploy (Traefik)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
