FROM oven/bun:1 AS base

WORKDIR /app

# Install sqlite3 CLI
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Create a directory for persistent data
RUN mkdir -p /app/data

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

RUN bun run build

# Expose port
EXPOSE 3001

ENTRYPOINT ["bun", "run", "docker:start"]
