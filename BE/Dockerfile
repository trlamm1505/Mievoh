FROM node:22.16.0-alpine AS build

# Cài đặt bash và openssl (cần cho Prisma)
RUN apk add --no-cache bash openssl

WORKDIR /app

# 1. Copy package và prisma trước để tận dụng cache
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./ 

RUN npm install

# 2. Generate Prisma Client (Bắt buộc phải có để build NestJS)
# Cấp một DATABASE_URL ảo để Prisma không báo lỗi trong lúc Build (Lúc chạy thật Docker Compose sẽ tự chèn biến thật vào)
ENV DATABASE_URL="mongodb://dummy"
RUN npx prisma generate

# Copy toàn bộ mã nguồn
COPY . .

RUN npm run build

# Copy Prisma generated JS files to dist so they can be loaded at runtime
RUN mkdir -p dist/src/modules-system/prisma/generated/prisma && \
    cp -r src/modules-system/prisma/generated/prisma/* dist/src/modules-system/prisma/generated/prisma/

RUN npm prune --production

# --- Stage Final ---
FROM node:22.16.0-alpine AS final

# Cài đặt bash và openssl cho stage final (Prisma runtime cần)
RUN apk add --no-cache bash openssl

WORKDIR /app

# Copy các file cần thiết từ stage build
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./

# Expose port
EXPOSE 3069

# Khởi chạy ứng dụng (Sử dụng đường dẫn lồng dist/src do prisma.config.ts)
CMD ["node", "dist/src/main.js"]
