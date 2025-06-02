# Frontend Dockerfile

FROM node:20-bookworm-slim
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start"] 