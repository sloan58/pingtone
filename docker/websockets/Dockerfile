FROM node:22-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files from websockets directory
COPY docker/websockets/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY ./docker/websockets/ssh-proxy.js ./

# Expose WebSocket port
EXPOSE 8080

# Start the WebSocket server
CMD ["node", "ssh-proxy.js"]
