# Multi-stage build for Node.js TypeScript application
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Install necessary packages for building
RUN apk add --no-cache postgresql-client openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install necessary packages for production
RUN apk add --no-cache postgresql-client curl openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy scripts
COPY scripts ./scripts
RUN chmod +x ./scripts/docker-migrate.sh ./scripts/docker-start.sh

# Create logs directory
RUN mkdir -p /app/logs

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application with proper initialization
CMD ["sh", "./scripts/docker-start.sh"]