FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma client in production
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5001

# Health check - use 127.0.0.1 instead of localhost to avoid IPv6 issues
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=5 \
  CMD wget --spider --quiet http://127.0.0.1:5001/health || exit 1

# Start server (migrations should be run manually or via CI/CD)
CMD ["node", "dist/server.js"]
