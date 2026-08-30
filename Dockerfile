# ==========================================
# DISISTA CONTROL — Production Frontend Container
# ==========================================

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
COPY frontend-server.js ./
COPY frontend ./frontend

EXPOSE 8080

CMD ["node", "frontend-server.js"]
