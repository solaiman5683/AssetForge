# Multi-stage build for optimal size
FROM node:18-slim AS builder

# Install system dependencies for Sharp and other native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create tmp directory for uploads
RUN mkdir -p tmp && chmod 777 tmp

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5173/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the cloud server
CMD ["node", "src/ui/server-cloud.js"]
