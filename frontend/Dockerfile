# Multi-stage build for production-optimized frontend
FROM node:18-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production && \
    npm cache clean --force

# Production runtime stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy dependencies from builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json

# Copy frontend application
COPY frontend ./frontend
COPY frontend-server.js .

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001

USER frontend

EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "frontend-server.js"]
