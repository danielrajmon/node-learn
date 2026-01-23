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
EXPOSE 3005

# Start application
CMD ["npm", "run", "start:prod"]
