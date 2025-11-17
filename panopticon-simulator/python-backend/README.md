# Python Backend (FastAPI)

이 디렉터리는 기존 NestJS 백엔드와 동일한 기능을 FastAPI + SQLAlchemy 기반으로 구현한 버전입니다. 동일한 Postgres 스키마를 사용하며, **현재는 어떤 수집기나 에이전트도 포함되어 있지 않은 클린 상태**입니다. 관측 도구는 나중에 필요에 따라 직접 붙여 주세요.

## 주요 스택
- FastAPI + Uvicorn
- SQLAlchemy + psycopg2

## 실행 방법
```bash
cd panopticon-simulator/python-backend
python -m venv .venv && source .venv/bin/activate  # 선택 사항
pip install -r requirements.txt
export DATABASE_HOST=postgres
export DATABASE_USER=panopticon
export DATABASE_PASSWORD=panopticon
export DATABASE_NAME=panopticon
uvicorn app.main:app --reload --port 3000
```

## Docker 빌드
```bash
cd panopticon-simulator/python-backend
docker build -t ecommerce-backend-python:latest .
```

## Kubernetes 배포 (예시)
`panopticon-simulator/infra/k8s/tenant-a/python-backend-deployment.yaml` 을 참고하여, 기존 백엔드와 동일한 ConfigMap/Service를 붙여 사용할 수 있습니다.
