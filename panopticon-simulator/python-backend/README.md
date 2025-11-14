# Python Backend (FastAPI)

이 디렉터리는 기존 NestJS 백엔드와 동일한 기능을 FastAPI + SQLAlchemy 기반으로 구현한 버전입니다. 동일한 Postgres 스키마를 사용하며, OpenTelemetry HTTP/DB span 을 OTLP HTTP 엔드포인트(기본: `http://otel-collector.tenant-a.svc.cluster.local:4318`)로 내보냅니다.  

## 주요 스택
- FastAPI + Uvicorn
- SQLAlchemy + psycopg2
- OpenTelemetry SDK + FastAPI / psycopg2 / SQLAlchemy instrumentation

## 실행 방법
```bash
cd panopticon-simulator/python-backend
python -m venv .venv && source .venv/bin/activate  # 선택 사항
pip install -r requirements.txt
export DATABASE_HOST=postgres
export DATABASE_USER=panopticon
export DATABASE_PASSWORD=panopticon
export DATABASE_NAME=panopticon
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
uvicorn app.main:app --reload --port 3000
```

## Docker 빌드
```bash
cd panopticon-simulator/python-backend
docker build -t ecommerce-backend-python:latest .
```

## Kubernetes 배포 (예시)
`panopticon-simulator/k8s/tenant-a/python-backend-deployment.yaml` 을 참고하여, 기존 백엔드와 동일한 ConfigMap/Service를 붙여 사용할 수 있습니다.
