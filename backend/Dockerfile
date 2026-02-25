FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including bcrypt build tools if needed by alpine)
RUN apk add --no-cache make gcc g++ python3 && \
    npm install && \
    apk del make gcc g++ python3

# Copy application source
COPY . .

# Ensure the db directory exists and has correct permissions for SQLite
RUN mkdir -p db && chown -R node:node db

EXPOSE 5000

# Run as non-root user
USER node

CMD ["node", "server.js"]
