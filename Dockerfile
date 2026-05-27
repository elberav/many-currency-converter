FROM node:20-alpine AS builder

# Configurar directorio de trabajo
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar TODAS las dependencias (incluyendo devDependencies para compilar TypeScript)
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript a JavaScript
RUN pnpm run build

# --- Etapa de Producción ---
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Instalar SOLO las dependencias de producción (más ligero y seguro)
RUN pnpm install --prod --frozen-lockfile

# Exponer el puerto
EXPOSE 8000

# Iniciar la aplicación
CMD ["pnpm", "start"]