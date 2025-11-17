## Docker 개발 환경

이 디렉터리는 **백엔드(NestJS) + 프런트엔드(Next.js) + Postgres** 를 로컬 Docker Compose 로 실행하기 위한 설정을 담고 있습니다.

### 구성 요소
- `postgres`: 애플리케이션 데이터베이스
- `app`: `../backend` 코드 기반 NestJS API
- `frontend`: `../frontend` 코드 기반 Next.js UI

### 준비
1. `.env` 파일을 생성하고 포트/DB 정보를 채웁니다.
   ```bash
   cd panopticon-simulator/infra/docker
   cp .env.demo .env
   # DATABASE_*, BACKEND_PORT, FRONTEND_PORT, NEXT_PUBLIC_API_URL 등을 필요에 맞게 수정
   ```

### 실행
```bash
docker compose up -d --build
```

### 확인
- 백엔드: http://localhost:3000
- 프런트엔드: http://localhost:3001
- Postgres: localhost:${POSTGRES_PORT:-5432}

필요 시 `docker compose logs -f app frontend postgres` 로 로그를 확인할 수 있습니다.
