FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY services/api-gateway/package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY services/api-gateway/src ./src
COPY services/api-gateway/tsconfig.json ./
COPY openapi.yaml ./

# Build
RUN npm run build

# Remove devDependencies for production
RUN npm ci --only=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/main.js"]
