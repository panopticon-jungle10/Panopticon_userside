# Ingest Server

임시 관찰용 OpenTelemetry 수집 서버입니다. OTLP HTTP(Protobuf/JSON)로 들어오는 traces/metrics와 Fluent Bit HTTP 출력(JSON)을 그대로 받아 콘솔에 덤프해 주는 것이 목적이라, 장기 보관이나 분석을 위한 스토리지는 포함되어 있지 않습니다.

## 주요 기능

- `/v1/traces`, `/v1/metrics`에서 `Content-Type: application/x-protobuf` 본문을 ProtobufJS로 디코드하여 OpenTelemetry 구조체(JSON)로 출력
- Fluent Bit가 HTTP JSON으로 전송하는 로그를 `/v1/logs`에서 그대로 출력
- `/health` 헬스체크 제공 및 알 수 없는 경로 접근 시 404 JSON 응답
- 포트는 기본 `4318`; `PORT` 환경 변수로 덮어쓸 수 있음

> ⚠️ **프로덕션 용도가 아닙니다.** 인증, 큐잉, 스토리지, 백프레셔가 없으므로 디버깅/시연 중 수집 데이터 확인용으로만 사용하세요.

## 실행 방법

```bash
cd panopticon-simulator/ingest-server

# 의존성 설치
npm install

# 개발 모드(소스에서 즉시 실행)
npm run dev

# 빌드 후 실행
npm run build
npm start
```

## 엔드포인트

| 메서드 | 경로          | 설명                                                                               |
| ------ | ------------- | ---------------------------------------------------------------------------------- |
| GET    | `/health`     | 서버 상태, 타임스탬프, 서비스 이름을 반환                                          |
| POST   | `/v1/traces`  | OTLP Trace HTTP 엔드포인트. Protobuf/JSON 모두 지원, `resourceSpans` 개수 응답     |
| POST   | `/v1/metrics` | OTLP Metrics HTTP 엔드포인트. Protobuf/JSON 모두 지원, `resourceMetrics` 개수 응답 |
| POST   | `/v1/logs`    | Fluent Bit HTTP 출력 또는 OTLP Logs JSON을 그대로 받아 로그로 출력                 |

## 연동 위치

- **Fluent Bit**: `panopticon-simulator/k8s/tenant-a/fluent-bit-config.yaml`에서 `[OUTPUT] Name http`가 이 서버의 `http://ingest-server.tenant-a.svc.cluster.local:4318/v1/logs`로 전송합니다.
- **OTel Collector**: `panopticon-simulator/k8s/tenant-a/otel-collector-config.yaml`의 `exporters.otlphttp`가 traces/metrics를 동일한 서비스에 POST합니다.

위와 같이 사용하면 로컬 kind/minikube 클러스터에서 애플리케이션이 내보내는 관측 데이터를 쉽게 확인할 수 있습니다.
필요 없어지면 Collector/Fluent Bit의 exporter를 상용 APM/Log SaaS로 바꾸고 이 서버는 제거하면 됩니다.
