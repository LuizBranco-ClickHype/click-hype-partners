# ===============================================
# CLICK HYPE PARTNERS - BACKEND DOCKERFILE
# Multi-stage build otimizado para produção
# ===============================================

# ===== STAGE 1: Base =====
FROM node:18-alpine AS base
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# Configurar Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ===== STAGE 2: Dependencies =====
FROM base AS deps

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN npm ci --only=production && \
    npm cache clean --force

# ===== STAGE 3: Builder =====
FROM base AS builder
WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Instalar dependências de desenvolvimento para build
RUN npm ci

# Build da aplicação
RUN npm run build

# ===== STAGE 4: Production =====
FROM base AS production
WORKDIR /app

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar apenas o necessário para produção
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Criar diretórios necessários
RUN mkdir -p uploads pdfs logs && \
    chown -R nodejs:nodejs /app

# Usar usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Health check otimizado
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api/v1/health || exit 1

# Comando para iniciar aplicação
CMD ["node", "dist/main.js"] 