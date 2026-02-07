FROM node:20-alpine

WORKDIR /app

# Copy events and messaging packages and service package files
COPY packages/events ./packages/events
COPY packages/messaging ./packages/messaging
COPY services/auth/package*.json ./services/auth/

# Build shared packages first
WORKDIR /app/packages/events
RUN npm ci && npm run build

WORKDIR /app/packages/messaging
RUN npm ci && npm run build

# Install dependencies (including dev deps for build)
WORKDIR /app/services/auth
RUN npm ci

# Copy source code
WORKDIR /app
COPY services/auth ./services/auth

# Build the application
WORKDIR /app/services/auth
RUN npm run build

# Remove dev dependencies and keep only production packages
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]
