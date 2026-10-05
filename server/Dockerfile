FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist/src ./dist/src
COPY package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
