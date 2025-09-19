FROM node:20-slim
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend/ ./
ENV PORT=8080
EXPOSE 8080
CMD ["npm","start"]
