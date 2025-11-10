## 시뮬레이터 구성 요소 설명

1. Frontend (Next.js)

- 홈쇼핑 UI
- OTel SDK로 브라우저 traces 수집
- Backend API 호출

2. Backend (NestJS)
   REST API (상품, 주문, 장바구니)
   OTel SDK로 traces & metrics 수집
   Winston/Pino로 structured logging
   의도적 에러/지연 시뮬레이션

3. Load Generator
   자동으로 API 호출 (사용자 시뮬레이션)
   다양한 시나리오 (정상, 에러, 느린 요청)
   시연 시간 15분간 계속 실행

4. OTel Collector (DaemonSet)
   App traces & metrics 수집
   Host metrics 수집 (hostmetrics receiver)
   Panopticon Gateway로 전송

5. Fluent Bit (DaemonSet)
   컨테이너 로그 수집

## 시뮬레이터 폴더 구조

panopticon-simulator/
├── README.md
├── docker-compose.yml # 로컬 개발용 (선택)
│
├── frontend/ # Next.js 홈쇼핑 프론트
│ ├── Dockerfile
│ ├── package.json
│ ├── next.config.js
│ ├── instrumentation.ts # Next.js OTel 설정
│ ├── src/
│ │ ├── app/
│ │ │ ├── layout.tsx
│ │ │ ├── page.tsx # 홈쇼핑 메인
│ │ │ ├── products/
│ │ │ │ └── page.tsx # 상품 목록
│ │ │ ├── cart/
│ │ │ │ └── page.tsx # 장바구니
│ │ │ └── checkout/
│ │ │ └── page.tsx # 결제
│ │ ├── components/
│ │ │ ├── ProductCard.tsx
│ │ │ ├── Cart.tsx
│ │ │ └── Header.tsx
│ │ └── lib/
│ │ ├── api.ts # Backend API 호출
│ │ └── otel.ts # OTel 설정
│ └── public/
│
├── backend/ # NestJS API 서버
│ ├── Dockerfile
│ ├── package.json
│ ├── nest-cli.json
│ ├── tsconfig.json
│ ├── src/
│ │ ├── main.ts # OTel 초기화
│ │ ├── app.module.ts
│ │ ├── products/
│ │ │ ├── products.controller.ts
│ │ │ ├── products.service.ts
│ │ │ └── products.module.ts
│ │ ├── orders/
│ │ │ ├── orders.controller.ts
│ │ │ ├── orders.service.ts
│ │ │ └── orders.module.ts
│ │ ├── cart/
│ │ │ ├── cart.controller.ts
│ │ │ ├── cart.service.ts
│ │ │ └── cart.module.ts
│ │ └── common/
│ │ ├── interceptors/
│ │ │ └── logging.interceptor.ts # 로그 인터셉터
│ │ └── filters/
│ │ └── http-exception.filter.ts
│ └── otel-config.ts # OTel SDK 설정
│
├── load-generator/ # 자동 트래픽 생성기
│ ├── Dockerfile
│ ├── package.json
│ ├── src/
│ │ ├── index.ts
│ │ ├── scenarios/
│ │ │ ├── normal-user.ts # 일반 사용자 시나리오
│ │ │ ├── heavy-user.ts # 파워 유저 시나리오
│ │ │ └── error-prone.ts # 에러 발생 시나리오
│ │ └── utils/
│ │ └── random.ts
│ └── config/
│ └── scenarios.json
│
├── k8s/ # Kubernetes 배포 설정
│ ├── namespace.yaml
│ │
│ ├── tenant-a/ # User A (Tenant A) 환경
│ │ ├── configmap.yaml
│ │ ├── frontend-deployment.yaml
│ │ ├── frontend-service.yaml
│ │ ├── backend-deployment.yaml
│ │ ├── backend-service.yaml
│ │ ├── load-generator-deployment.yaml
│ │ ├── otel-collector-config.yaml
│ │ ├── otel-collector-daemonset.yaml
│ │ └── fluent-bit-config.yaml
│ │ └── fluent-bit-daemonset.yaml
│ │
│ ├── tenant-b/ # User B (Tenant B) 환경
│ │ ├── configmap.yaml
│ │ ├── frontend-deployment.yaml
│ │ ├── frontend-service.yaml
│ │ ├── backend-deployment.yaml
│ │ ├── backend-service.yaml
│ │ ├── load-generator-deployment.yaml
│ │ ├── otel-collector-config.yaml
│ │ ├── otel-collector-daemonset.yaml
│ │ └── fluent-bit-config.yaml
│ │ └── fluent-bit-daemonset.yaml
│ │
│ └── deploy.sh # 배포 스크립트
│
├── otel-config/ # OTel Collector 설정 템플릿
│ ├── collector-config.yaml
│ └── README.md
│
├── fluent-bit-config/ # Fluent Bit 설정 템플릿
│ ├── fluent-bit.conf
│ ├── parsers.conf
│ └── README.md
│
└── scripts/
├── build-all.sh # 전체 이미지 빌드
├── deploy-tenant-a.sh # Tenant A 배포
├── deploy-tenant-b.sh # Tenant B 배포
└── cleanup.sh # 전체 삭제

## 로컬 브라우저에서 클러스터 앱 접속하기 (Ingress)

1. **Ingress Controller 설치**  
   kind 기준 예시:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
   ```

2. **Ingress 리소스 적용**  
   `frontend`/`backend`를 외부 호스트로 노출:
   ```bash
   kubectl apply -f k8s/tenant-a/ingress.yaml
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
