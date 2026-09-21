# Este Dockerfile es para levantar/probar el frontend localmente (por
# ejemplo con docker-compose junto a proyecto_1). El despliegue real es
# subir el contenido de dist/ (generado con "npm run build" y .env.production)
# como sitio estatico a un bucket S3, no este contenedor.

# ---- Etapa 1: build con Vite ----
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# ---- Etapa 2: servir el build estatico con nginx ----
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
