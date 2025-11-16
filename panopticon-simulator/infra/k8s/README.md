## Kubernetes 배포 (Clean 상태)

이 폴더에는 이커머스 애플리케이션을 실행하는데 필요한 리소스만 포함되어 있습니다.

- `namespace.yaml`: `tenant-a` 네임스페이스 생성
- `tenant-a/postgres-statefulset.yaml`: Postgres + PersistentVolume
- `tenant-a/backend-*.yaml`, `tenant-a/frontend-*.yaml`: NestJS 백엔드와 Next.js 프론트
- `tenant-a/python-backend-deployment.yaml`: 필요 시 FastAPI 버전 배포 (선택)
- `tenant-a/ingress.yaml`: ingress-nginx 기준 도메인 노출

관측/수집기(OTel Collector, Fluent Bit 등) 리소스는 모두 제거된 상태입니다.

### 배포 방법

```bash
# (project root 기준) 네임스페이스 및 앱 리소스 배포
kubectl apply -f panopticon-simulator/infra/k8s/namespace.yaml
kubectl apply -f panopticon-simulator/infra/k8s/tenant-a

# ingress-nginx 를 이미 설치했다면 ingress 적용
kubectl apply -f panopticon-simulator/infra/k8s/tenant-a/ingress.yaml
```

이렇게 하면 백엔드/프론트/DB만 포함된 클린 환경이 준비됩니다. 이후에는 Panopticon AI 설치 가이드에 따라 원하는 관측 도구를 별도로 배포하면 됩니다.
