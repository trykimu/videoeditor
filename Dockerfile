FROM node:23-slim AS pnpm-base
# Install pnpm
RUN npm install -g pnpm
# Install dependencies for remotion
RUN apt-get update
RUN apt install -y \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libgbm-dev \
  libasound2 \
  libxrandr2 \
  libxkbcommon-dev \
  libxfixes3 \
  libxcomposite1 \
  libxdamage1 \
  libatk-bridge2.0-0 \
  libpango-1.0-0 \
  libcairo2 \
  libcups2
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Development dependencies
FROM pnpm-base AS development-dependencies-env
COPY package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install

# Production dependencies
FROM pnpm-base AS production-dependencies-env
COPY package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install --frozen-lockfile --prod

# Build
FROM pnpm-base AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm run build

# Final image
FROM pnpm-base
COPY package.json pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["pnpm", "run", "start"]