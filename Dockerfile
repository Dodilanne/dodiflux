FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

RUN bun run build

# Expose port
EXPOSE 3001

# Run the app
CMD ["bun", "run", "src/index.tsx"]
