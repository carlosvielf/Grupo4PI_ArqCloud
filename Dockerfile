# Imagem de build compartilhada pelos dois serviços.
FROM node:24-bookworm-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serviço da API: Node serve os endpoints e mantém as conexões externas.
FROM node:24-bookworm-slim AS api

WORKDIR /app
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=8088

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 8088
CMD ["npm", "start"]

# Serviço web: Nginx entrega o build e encaminha /api para a API.
FROM nginx:1.27-alpine AS web

COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
