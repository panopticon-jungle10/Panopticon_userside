## Docker Compose 환경

이 디렉터리는 관측 도구가 전혀 없는 **클린 로컬 실행 환경**을 제공합니다.

구성 요소:
- `backend`: NestJS API (../backend Dockerfile 빌드)
- `frontend`: Next.js UI
- `postgres`: 애플리케이션 데이터베이스

### 실행 방법

```bash
cd panopticon-simulator/infra/docker
cp .env.demo .env        # 필요한 값이 있으면 수정
docker compose up -d
```

기본 포트
- Backend API: http://localhost:3000
- Frontend UI: http://localhost:3001
- Postgres: localhost:5432 (사용자/비밀번호는 `.env` 참고)

컨테이너는 애플리케이션만 포함하며, OTLP/Fluent Bit/Collector 등의 수집기는 포함되어 있지 않습니다.  
필요 시 Panopticon 가이드를 따라 별도 컨테이너를 추가하면 됩니다.
