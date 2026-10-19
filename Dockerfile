# Build client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build server
FROM node:20-bookworm-slim AS server-build
WORKDIR /app/server
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY server/package*.json ./
RUN npm ci
COPY server/ ./

# Runtime
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apt-get update && apt-get install -y --no-install-recommends bash procps util-linux && rm -rf /var/lib/apt/lists/*
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server ./server
COPY --from=client-build /app/client/dist ./client/dist
EXPOSE 3000
WORKDIR /app/server
CMD ["node", "index.js"]
