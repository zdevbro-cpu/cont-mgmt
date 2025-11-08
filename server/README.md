# Contract Management System - Backend Server

Node.js + Express + Supabase 기반 계약관리 시스템 백엔드

## 📂 폴더 구조

```
server/
├── src/
│   ├── config/
│   │   └── supabase.js          # Supabase 클라이언트 설정
│   ├── middleware/
│   │   └── auth.middleware.js   # 인증 미들웨어
│   ├── routes/
│   │   └── auth.routes.js       # 인증 관련 라우트
│   ├── controllers/             # (추후 추가)
│   ├── services/                # (추후 추가)
│   └── server.js                # 서버 진입점
├── .env                         # 환경 변수 (생성 필요)
├── .env.example                 # 환경 변수 템플릿
├── .gitignore
└── package.json
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd server
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# Supabase 설정 (Supabase Dashboard에서 확인)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 서버 실행

```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:5000`에서 실행됩니다.

## 📡 API 엔드포인트

### Health Check
```
GET /health
```

### 인증 (Authentication)

#### 회원가입
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "홍길동"
}
```

#### 사용자 정보 조회
```
GET /api/auth/me
Authorization: Bearer {access_token}
```

## 🔐 인증 방식

- Frontend에서 Supabase Auth를 사용하여 로그인/회원가입
- 발급받은 JWT 토큰을 `Authorization: Bearer {token}` 헤더로 전송
- Backend에서 토큰 검증 및 사용자 정보 확인

## 📝 개발 진행 상황

- [x] 기본 서버 구조
- [x] Supabase 연동
- [x] 인증 미들웨어
- [x] 회원가입/로그인 API
- [ ] 계약 CRUD API
- [ ] 파일 업로드 API
- [ ] 지급 스케줄 API
- [ ] 관리자 API

## 🛠️ 다음 작업

1. 계약 관련 API 구현
2. 파일 업로드 기능 (Multer + Supabase Storage)
3. 검색/필터링 기능
4. 지급 스케줄 계산 로직
5. 관리자 기능

## 📚 사용 기술

- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **Supabase** - 데이터베이스 및 인증
- **Helmet** - 보안 헤더
- **CORS** - Cross-Origin Resource Sharing
- **Express Validator** - 입력 검증