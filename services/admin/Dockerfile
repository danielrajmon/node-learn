FROM node:20-alpine

WORKDIR /app

# Copy events and messaging packages and service package files
COPY packages/events ./packages/events
COPY packages/messaging ./packages/messaging
COPY services/admin/package*.json ./services/admin/

# Build shared packages first
WORKDIR /app/packages/events
RUN npm ci && npm run build

WORKDIR /app/packages/messaging
RUN npm ci && npm run build

# Install dependencies
WORKDIR /app/services/admin
RUN npm ci

# Copy source code
WORKDIR /app
COPY services/admin ./services/admin

# Build TypeScript
WORKDIR /app/services/admin
RUN npm run build

# Remove dev dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3007

# Start service
CMD ["npm", "start"]
