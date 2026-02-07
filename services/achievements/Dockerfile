FROM node:20-alpine

WORKDIR /app

# Copy events and messaging packages and service package files
COPY packages/events ./packages/events
COPY packages/messaging ./packages/messaging
COPY services/achievements/package*.json ./services/achievements/

# Build shared packages first
WORKDIR /app/packages/events
RUN npm ci && npm run build

WORKDIR /app/packages/messaging
RUN npm ci && npm run build

# Install dependencies
WORKDIR /app/services/achievements
RUN npm ci

# Copy source code
WORKDIR /app
COPY services/achievements ./services/achievements

# Build application
WORKDIR /app/services/achievements
RUN npm run build

# Remove dev dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3004/achievements/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start application
CMD ["node", "dist/main"]
