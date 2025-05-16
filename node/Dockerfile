# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy only the necessary files
COPY ./server.js ./
COPY ./dist/ ./dist/

# Expose the port the app runs on
EXPOSE 7001

# Start the server
CMD ["node", "server.js"]
