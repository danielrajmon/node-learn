FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build application
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
