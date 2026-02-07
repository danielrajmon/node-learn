FROM node:20-alpine

WORKDIR /app

# Copy events and messaging packages and service package files
COPY packages/events ./packages/events
COPY packages/messaging ./packages/messaging
COPY services/leaderboard/package*.json ./services/leaderboard/

# Build shared packages first
WORKDIR /app/packages/events
RUN npm ci && npm run build

WORKDIR /app/packages/messaging
RUN npm ci && npm run build

# Install dependencies
WORKDIR /app/services/leaderboard
RUN npm ci

# Copy source code
WORKDIR /app
COPY services/leaderboard ./services/leaderboard

# Build application
WORKDIR /app/services/leaderboard
RUN npm run build

# Remove dev dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3005

# Start application
CMD ["npm", "run", "start:prod"]
