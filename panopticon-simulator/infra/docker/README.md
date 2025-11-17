## Docker 관측 PoC 환경

이 디렉터리는 **로컬 Docker Compose 한 번으로 Node.js 백엔드 + OTEL Collector + Fluent Bit** 를 함께 띄워 AWS Panopticon 엔드포인트로 로그/트레이스를 전송하는 PoC 구성을 제공합니다.

### 구성 요소
- `app`: `../backend` 기반 NestJS API. `/usr/src/app/logs/app.log` 로 JSON 로그를 남깁니다.
- `otel-collector`: `otel/opentelemetry-collector-contrib` 기반 OTLP 수신 → Panopticon trace endpoint 로 export
- `fluent-bit`: Node 앱의 파일 로그를 tail 해서 Panopticon log endpoint 로 전달
- `postgres`, `frontend`: 기존 demo 서비스 (필요시 함께 사용)

### 준비
1. 환경 변수 템플릿을 복사하고 실제 엔드포인트/API Key 를 채웁니다.
   ```bash
   cd panopticon-simulator/infra/docker
   cp .env.demo .env
   # SERVICE_NAME, PANOPTICON_* 값, DB 정보, LOG_FILE_PATH, OTEL_COLLECTOR_* 등을 수정
   ```
2. `.env` 내 값은 Docker Compose 뿐 아니라 Collector/Fluent Bit/Node 앱 설정에 바로 주입됩니다.

### 실행
```bash
docker compose up -d --build
```

컨테이너가 올라오면:
- OTLP HTTP 수신 포트 `4318` 이 로컬에 노출됩니다.
- Fluent Bit 은 `app-logs` 볼륨을 `/logs` 로 마운트하여 `/usr/src/app/logs/app.log` 을 읽습니다.
- Node.js 앱은 OTLP HTTP 로 Collector(`http://otel-collector:4318/v1/traces`) 에 트레이스를 전송합니다.

### PoC 검증 절차
1. 백엔드에 몇 번 요청을 보내어 트래픽/로그를 생성합니다.
   ```bash
   curl http://localhost:3000/products
   curl http://localhost:3000/orders
   ```
2. AWS Panopticon **ingest (trace) endpoint** 에서 새로운 span 이 들어오는지 확인합니다.
   - Collector가 `${PANOPTICON_TRACE_ENDPOINT}` 로 `x-tenant-id`, `x-api-key` 헤더와 함께 전송합니다.
3. AWS Panopticon **log endpoint** 에서 서비스 로그가 수신되는지 확인합니다.
   - Fluent Bit HTTP output 이 `${PANOPTICON_LOG_HOST}:${PANOPTICON_LOG_PORT}${PANOPTICON_LOG_URI}` 로 JSON payload 를 보냅니다.
4. 필요하다면 `docker compose logs -f app fluent-bit otel-collector` 로 로컬 상태를 모니터링합니다.

이 구성을 기반으로 다른 환경(Kubernetes/Helm 등) 으로 옮길 때도 동일한 `.env` → 환경변수 → 설정 파일 흐름을 유지할 수 있습니다.
