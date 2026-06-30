FROM node:20-slim

WORKDIR /app

# Install deps (better-sqlite3 ships prebuilt binaries for this platform)
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
