FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 포트 설정 (Cloud Run이 동적으로 설정)
EXPOSE 8080

# 실행 명령
CMD ["npm", "start"]
