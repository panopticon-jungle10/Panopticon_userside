# 로그 수집 시스템 문서

## 개요

현재 시스템에서 로그는 **Fluent-bit**을 통해 수집되어 **ingest-server**로 전송됩니다.

## 아키텍처

```
[Kubernetes Pods]
    ↓ (stdout/stderr → /var/log/containers/*.log)
[Fluent-bit DaemonSet]
    ↓ (HTTP POST /fluent-bit/logs, JSON 형식)
[ingest-server:4318]
```

## 1. Fluent-bit 설정

### 위치
- **네임스페이스**: `logging`
- **DaemonSet**: `fluent-bit`
- **ConfigMap**: `fluent-bit-config`

### 설정 상세

#### INPUT 섹션
```conf
[INPUT]
    Name tail
    Path /var/log/containers/*tenant-a*.log
    multiline.parser docker, cri
    Tag kube.*
    Mem_Buf_Limit 5MB
    Skip_Long_Lines On
```

- **수집 대상**: `tenant-a` 네임스페이스의 모든 컨테이너 로그
- **로그 파일 경로**: `/var/log/containers/*tenant-a*.log`
- **파서**: Docker 및 CRI 형식 지원
- **태그**: `kube.*`

#### FILTER 섹션
```conf
[FILTER]
    Name kubernetes
    Match kube.*
    Kube_URL https://kubernetes.default.svc:443
    Kube_CA_File /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    Kube_Token_File /var/run/secrets/kubernetes.io/serviceaccount/token
    Kube_Tag_Prefix kube.var.log.containers.
    Merge_Log On
    Keep_Log Off
    K8S-Logging.Parser On
    K8S-Logging.Exclude On
```

- **Kubernetes 메타데이터 enrichment**: Pod 이름, 네임스페이스, 컨테이너 이름, 레이블 등 자동 추가
- **Merge_Log On**: JSON 로그를 파싱하여 병합
- **Keep_Log Off**: 원본 로그 필드 제거 (파싱 후)

#### OUTPUT 섹션
```conf
[OUTPUT]
    Name http
    Match kube.*
    Host ingest-server.default.svc.cluster.local
    Port 4318
    URI /fluent-bit/logs
    Format json
    json_date_key timestamp
    json_date_format iso8601
```

- **프로토콜**: HTTP POST
- **엔드포인트**: `http://ingest-server.default.svc.cluster.local:4318/fluent-bit/logs`
- **형식**: JSON 배열
- **타임스탬프**: ISO 8601 형식

## 2. 로그 데이터 형식

### HTTP 요청 형식

```http
POST /fluent-bit/logs HTTP/1.1
Host: ingest-server.default.svc.cluster.local:4318
Content-Type: application/json

[
  {
    "timestamp": "2025-11-09T08:53:22.942Z",
    "log": "[Nest] 1  - 11/09/2025, 8:53:22 AM    LOG [AppController] Health check",
    "stream": "stdout",
    "kubernetes": {
      "pod_name": "backend-8856fd445-tfstq",
      "namespace_name": "tenant-a",
      "pod_id": "...",
      "labels": {
        "app": "backend",
        "pod-template-hash": "8856fd445"
      },
      "annotations": {...},
      "host": "panopticon-control-plane",
      "container_name": "backend",
      "docker_id": "...",
      "container_hash": "...",
      "container_image": "localhost/ecommerce-backend:latest"
    }
  },
  ...
]
```

### 주요 필드 설명

#### 기본 필드
- **timestamp**: ISO 8601 형식의 타임스탬프
- **log**: 실제 로그 메시지 (전체 텍스트)
- **stream**: `stdout` 또는 `stderr`

#### Kubernetes 메타데이터 (kubernetes 객체 내부)
- **pod_name**: Pod 이름 (예: `backend-8856fd445-tfstq`)
- **namespace_name**: 네임스페이스 (예: `tenant-a`)
- **container_name**: 컨테이너 이름 (예: `backend`)
- **labels**: Pod 레이블 (key-value 쌍)
- **annotations**: Pod 어노테이션
- **host**: 실행 중인 노드 이름
- **container_image**: 컨테이너 이미지 이름
- **pod_id**: Pod UID

## 3. ingest-server 처리

### 엔드포인트
`POST /fluent-bit/logs`

### 처리 로직

```typescript
app.post('/fluent-bit/logs', (req: Request, res: Response) => {
  if (Array.isArray(req.body)) {
    // 로그 메시지 추출
    const logMessages = req.body.map((entry: any) => {
      const logMessage = entry.log || entry.message || JSON.stringify(entry);
      const namespace = entry.kubernetes?.namespace_name || 'unknown';
      const podName = entry.kubernetes?.pod_name || 'unknown';
      const containerName = entry.kubernetes?.container_name || 'unknown';
      const timestamp = entry.timestamp || entry['@timestamp'] || 'unknown';
      const stream = entry.stream || 'unknown';

      return {
        timestamp,
        namespace,
        podName,
        containerName,
        stream,
        log: logMessage
      };
    });

    // 로그 출력
    console.log(`[LOGS] ${logMessages.length} log entries from ${logMessages[0].namespace}/${logMessages[0].podName}`);
    logMessages.slice(0, 2).forEach((msg, i) => {
      console.log(`  [${i + 1}] [${msg.timestamp}] [${msg.stream}] ${msg.log.substring(0, 150)}`);
    });
  }

  res.status(200).json({ status: 'success' });
});
```

## 4. 로그 종류

### 애플리케이션 로그
- **소스**: NestJS 백엔드 (stdout)
- **형식**: NestJS 기본 로거 형식
- **예시**: `[Nest] 1  - 11/09/2025, 8:53:22 AM    LOG [AppController] Health check`

### HTTP 요청 로그
현재는 애플리케이션 레벨에서 수동 로깅이 필요합니다. OpenTelemetry SDK는 자동으로 **트레이스**를 생성하지만, HTTP 로그를 stdout으로 출력하지는 않습니다.

#### HTTP 로그 추가 방법 (권장)

백엔드에 미들웨어 추가:

```typescript
// backend/src/main.ts 또는 app.module.ts
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      type: 'http_request',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    }));
  });

  next();
});
```

이렇게 하면 Fluent-bit이 자동으로 수집하여 ingest-server로 전송합니다.

### 시스템 로그
- **OTel Collector 로그**: Collector 자체의 debug/info 로그
- **기타 컨테이너 로그**: 모든 tenant-a 네임스페이스의 컨테이너

## 5. 현재 수집 중인 로그 확인 방법

### Fluent-bit 상태 확인
```bash
kubectl get daemonset -n logging fluent-bit
kubectl logs -n logging -l app=fluent-bit --tail=50
```

### ingest-server에서 로그 확인
```bash
kubectl logs -n default -l app=ingest-server --tail=100 | grep "LOGS"
```

### 실시간 로그 모니터링
```bash
kubectl logs -n default -l app=ingest-server -f | grep "LOGS"
```

## 6. 로그 수집 흐름 요약

1. **애플리케이션**: 로그를 stdout/stderr에 출력
2. **Kubernetes**: 로그를 `/var/log/containers/*.log` 파일에 저장
3. **Fluent-bit**:
   - `tail` input으로 로그 파일 읽기
   - Kubernetes filter로 메타데이터 enrichment
   - HTTP output으로 ingest-server에 JSON 배열 전송
4. **ingest-server**:
   - `/fluent-bit/logs` 엔드포인트에서 수신
   - 로그 파싱 및 처리
   - (향후) 데이터베이스 저장 또는 분석 시스템으로 전달

## 7. 다음 단계 (팀에서 구현 필요)

### 백엔드 작업:
1. **로그 스키마 정의**: 로그 데이터를 어떤 형식으로 저장할지 결정
2. **데이터베이스 설계**: 로그 저장용 테이블 또는 인덱스 설계
3. **저장 로직 구현**: ingest-server에서 받은 로그를 DB에 저장
4. **로그 쿼리 API**: 로그 검색/필터링 API 개발
5. **HTTP 요청 로깅**: 백엔드에 HTTP 로깅 미들웨어 추가

### 추가 개선 사항:
- 로그 레벨 필터링 (ERROR, WARN, INFO, DEBUG)
- 로그 retention 정책
- 로그 압축 및 아카이빙
- 로그 기반 알림 시스템
