FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for environment variables
ARG PUBLIC_API_URL=http://localhost:5001
ARG PUBLIC_WS_URL=ws://localhost:5001/ws

# Set environment variables for build
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_WS_URL=$PUBLIC_WS_URL

# Build Astro app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve package globally for serving static files
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4321

# Serve the static files
CMD ["serve", "-s", "dist", "-l", "4321"]
