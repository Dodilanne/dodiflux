FROM oven/bun:1 AS base

WORKDIR /app

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

# Run the app
CMD ["sh", "-c", "bun run db:push && bun run src/index.tsx"]
