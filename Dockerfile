FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package.json pnpm-lock.yaml ./

RUN corepack enable
RUN corepack prepare
RUN pnpm install

COPY . .

ENV NEXTJS_OUTPUT_MODE=standalone
RUN pnpm build

FROM node:20-alpine AS production

WORKDIR /app
COPY --from=build /app/.next/standalone .

EXPOSE 3000

CMD ["node", "server.js"]
