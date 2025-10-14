FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Astro app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and built app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only
RUN npm ci --only=production

# Expose port
EXPOSE 4321

# Start Astro preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4321"]

