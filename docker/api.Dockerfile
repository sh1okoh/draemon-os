FROM node:25-bookworm-slim
WORKDIR /app
COPY package.json ./
COPY apps/tsconfig.json ./apps/tsconfig.json
RUN npm install
COPY apps ./apps
CMD ["npm", "run", "dev"]
