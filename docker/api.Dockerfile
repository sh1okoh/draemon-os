FROM node:25-bookworm-slim
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY apps ./apps
CMD ["bash", "-lc", "npm run migrate && npm run dev"]
