FROM node:20-alpine

WORKDIR /app/keeper

# Copy keeper package files
COPY keeper/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy keeper source
COPY keeper/src ./src
COPY keeper/tsconfig.json ./

# Create directory structure for contract files (matches path: ../../src/lib/contract)
RUN mkdir -p ../src/lib/contract

# Copy contract files from repo root
COPY src/lib/contract/deployment.json ../src/lib/contract/deployment.json
COPY src/lib/contract/abi.json ../src/lib/contract/abi.json

# Install ts-node globally
RUN npm install -g ts-node typescript

# Health check (optional - logs to stdout)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ps aux | grep -q '[t]s-node' || exit 1

# Start keeper
CMD ["ts-node", "src/index.ts"]
