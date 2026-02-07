FROM node:20-alpine

WORKDIR /app

# Copy events and messaging packages and service package files
COPY packages/events ./packages/events
COPY packages/messaging ./packages/messaging
COPY services/quiz/package*.json ./services/quiz/

# Build shared packages first
WORKDIR /app/packages/events
RUN npm ci && npm run build

WORKDIR /app/packages/messaging
RUN npm ci && npm run build

# Install dependencies
WORKDIR /app/services/quiz
RUN npm ci

# Copy source code
WORKDIR /app
COPY services/quiz ./services/quiz

# Build application
WORKDIR /app/services/quiz
RUN npm run build

# Remove dev dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "dist/main"]
