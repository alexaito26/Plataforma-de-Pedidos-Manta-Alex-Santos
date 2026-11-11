# --- Etapa 1: Build ---
FROM node:22-alpine AS build
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Etapa 2: Runtime ---
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copia package.json y package-lock.json también aquí
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]