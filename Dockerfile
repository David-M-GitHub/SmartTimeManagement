# Build web
FROM node:20-alpine AS webbuild
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY apps/web apps/web
RUN npm run -w @stm/web build

# Build server
FROM node:20-alpine AS serverbuild
WORKDIR /app
COPY package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY apps/server apps/server
# Ensure Prisma schema is present and generate client
RUN npm run -w @stm/server prisma:generate
COPY --from=webbuild /app/apps/web/dist apps/web/dist
RUN npm run -w @stm/server build

# Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=serverbuild /app/node_modules node_modules
COPY --from=serverbuild /app/apps/server/dist apps/server/dist
COPY --from=serverbuild /app/apps/server/package.json apps/server/package.json
COPY --from=serverbuild /app/apps/web/dist apps/web/dist
EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
