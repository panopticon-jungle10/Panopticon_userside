## Docker 개발 환경

이 디렉터리는 **백엔드(NestJS) + 프런트엔드(Next.js) + Postgres** 를 로컬 Docker Compose 로 실행하기 위한 설정을 제공합니다. 로그/트레이스는 컨테이너 밖에서 실행 중인 임시 수집 서버(`http://localhost:3005/producer/...`)로 직접 전송합니다.

### 구성 요소
- `postgres`: 기본 애플리케이션 데이터베이스
- `app`: `../backend` 코드로 빌드한 NestJS API (OTLP trace + HTTP log 전송 지원)
- `frontend`: `../frontend` 코드로 빌드한 Next.js UI (브라우저 OTEL auto instrumentation 활성화)

### 준비
1. `.env.demo` 를 복사해 실제 설정을 채웁니다.
   ```bash
   cd panopticon-simulator/infra/docker
   cp .env.demo .env
   # DATABASE_*, LOG_ENDPOINT, OTEL_EXPORTER_OTLP_TRACES_ENDPOINT, NEXT_PUBLIC_* 등을 필요에 맞게 수정
   ```
2. 프런트/백이 데이터를 보낼 임시 수집 서버를 로컬에서 실행해 `http://localhost:3005/producer/v1/logs|traces` 를 수신하도록 합니다.

### 실행
```bash
docker compose up -d --build
```
- 백엔드: http://localhost:${BACKEND_PORT:-3000}
- 프런트엔드: http://localhost:${FRONTEND_PORT:-3001}

### 확인
- `docker compose logs -f app frontend postgres` 로 컨테이너 로그를 확인합니다.
- mock 수집 서버 콘솔에서 전달된 로그/스팬이 출력되는지 확인합니다.
