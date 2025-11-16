## Installer UI (Local Playground)

간단한 Vite + React SPA로, Panopticon 설치 가이드를 로컬에서 테스트하는 용도입니다.

### 실행 방법

```bash
cd panopticon-simulator/installer-ui
npm install

# Vite dev server (기본 포트: 5173)
npm run dev
```

백엔드(NestJS)는 `http://localhost:3000`에서 실행된다고 가정합니다.  
다른 포트를 사용한다면 `.env`에 `VITE_BACKEND_URL`을 설정하거나, `npm run dev` 전에

```bash
VITE_BACKEND_URL=http://localhost:4000 npm run dev
```

처럼 실행해 주세요.

### CORS

백엔드는 CORS가 활성화되어 있으며 Vite 개발 서버(포트 5173)에서 접근할 수 있습니다.  
필요하다면 백엔드 `main.ts`에서 허용 도메인을 조정하세요.
