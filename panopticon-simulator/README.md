## 시뮬레이터 구성 요소

1. **Frontend (Next.js)**  
   - 홈쇼핑 UI, 장바구니/결제 플로우  
   - Backend API 호출만 포함 (관측 도구 없음)

2. **Backend (NestJS)**  
   - 상품/주문/장바구니/사용자 API 제공  
   - Structured Logger로 JSON 로그 출력

3. **Python Backend (FastAPI)**  
   - 동일 스키마를 사용하는 FastAPI 버전  
   - 필요 시 Nest 대신 교체하여 사용할 수 있음

4. **Load Generator**  
   - Locust 기반 트래픽 시뮬레이터  
   - 로그인, 상품 탐색, 주문 작성 등 다양한 시나리오 실행

5. **배포 템플릿**  
   - `infra/k8s/`: Kubernetes 클러스터에 앱만 올릴 수 있는 클린 매니페스트  
   - `infra/docker/`: Docker Compose 로컬 실행 환경

> ⚠️ 이 레포는 이제 관측/수집기 컴포넌트를 포함하지 않습니다.  
> 추후 Panopticon AI 설치 가이드를 따라 새 OTEL/Agent 구성을 붙이면 됩니다.

## 주요 폴더

```
panopticon-simulator/
├── backend/             # NestJS API 서버
├── frontend/            # Next.js 홈쇼핑 UI
├── python-backend/      # FastAPI 대체 백엔드
├── load-generator/      # Locust 스クリپ트
├── infra/k8s/           # Kubernetes 매니페스트(클린 상태)
├── infra/docker/        # Docker Compose 환경
└── scripts/             # 이미지 빌드/배포 스크립트
```

각 하위 디렉터리에는 자체 README 또는 주석이 포함되어 있어 빌드/실행 방법을 확인할 수 있습니다.

## 로컬 브라우저에서 클러스터 앱 접속하기 (Ingress)

1. **Ingress Controller 설치**  
   kind 기준 예시:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
   ```

2. **Ingress 리소스 적용**  
   `frontend`/`backend`를 외부 호스트로 노출:
   ```bash
   kubectl apply -f infra/k8s/tenant-a/ingress.yaml
   ```

3. **hosts 파일에 도메인 매핑**  
   Ingress Controller가 노출되는 노드 IP(로컬 kind면 `127.0.0.1`)에 아래 호스트를 추가한다.
   ```
   127.0.0.1 frontend.panopticon.local
   127.0.0.1 backend.panopticon.local
   ```

4. **브라우저 접속**  
   - 프론트엔드: `http://frontend.panopticon.local`
   - 백엔드 API: `http://backend.panopticon.local/users`

이렇게 하면 프런트는 쿠버네티스 안에서 돌아가도 브라우저가 직접 접근해 버튼 클릭·로그인 등의 사용자 행동을 시험할 수 있다.

## 배포 옵션

- **Kubernetes**: `infra/k8s/README.md`를 참고해 namespace → statefulset/deployment → ingress 순으로 적용하면 됩니다.  
- **Docker Compose**: `infra/docker` 폴더의 안내에 따라 `.env`를 준비하고 `docker compose up -d`로 백엔드와 Postgres, 프론트엔드를 손쉽게 띄울 수 있습니다.
