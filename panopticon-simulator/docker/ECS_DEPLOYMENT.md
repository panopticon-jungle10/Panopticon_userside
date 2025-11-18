# ECS 배포 가이드

ECS에서 Fluent Bit 사이드카를 사용하여 Panopticon으로 로그를 전송하는 방법입니다.

## 아키텍처

```
┌─────────────────────────────────────┐
│      ECS Task (Fargate)             │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Backend    │  │  Fluent Bit  │ │
│  │  Container   │─▶│  (Sidecar)   │ │
│  │              │  │              │ │
│  │ fluentd log  │  │   forwards   │ │
│  │   driver     │  │   to         │ │
│  └──────────────┘  │  Panopticon  │ │
│       :24224       │     ALB      │ │
│                    └──────────────┘ │
└─────────────────────────────────────┘
                │
                ▼
    api.jungle-panopticon.cloud
         /producer/v1/logs
```

## 사전 준비

### 1. ECR 리포지토리 생성

```bash
# Backend 이미지용 리포지토리
aws ecr create-repository \
  --repository-name panopticon/backend \
  --region ap-northeast-2

# Fluent Bit 이미지용 리포지토리
aws ecr create-repository \
  --repository-name panopticon/fluent-bit \
  --region ap-northeast-2
```

### 2. IAM 역할 생성

**ecsTaskExecutionRole**: ECS가 ECR에서 이미지를 pull하고 CloudWatch Logs에 로그를 쓰기 위한 역할

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. CloudWatch Logs 그룹 생성

```bash
aws logs create-log-group \
  --log-group-name /ecs/panopticon-backend \
  --region ap-northeast-2
```

## 배포 단계

### Step 1: Fluent Bit 이미지 빌드 및 푸시

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com

# Fluent Bit 이미지 빌드
cd panopticon-simulator/docker
docker build -f Dockerfile.fluentbit -t panopticon/fluent-bit:latest .

# 태그 및 푸시
docker tag panopticon/fluent-bit:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/panopticon/fluent-bit:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/panopticon/fluent-bit:latest
```

### Step 2: Backend 이미지 푸시

```bash
# Backend 이미지 빌드 (이미 있다고 가정)
cd ../backend
docker build -t panopticon/backend:latest .

# 태그 및 푸시
docker tag panopticon/backend:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/panopticon/backend:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/panopticon/backend:latest
```

### Step 3: Task Definition 수정 및 등록

`ecs-task-definition.json` 파일에서 다음 항목을 실제 값으로 변경:

- `YOUR_ACCOUNT_ID`: AWS 계정 ID
- `YOUR_ECR_REPOSITORY`: ECR 리포지토리 URI
- `YOUR_RDS_ENDPOINT`: RDS 엔드포인트
- `REGION`: AWS 리전 (예: ap-northeast-2)

```bash
# Task Definition 등록
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region ap-northeast-2
```

### Step 4: ECS 서비스 생성 또는 업데이트

```bash
# 새 서비스 생성 (처음 배포하는 경우)
aws ecs create-service \
  --cluster your-cluster-name \
  --service-name panopticon-backend \
  --task-definition panopticon-backend-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3000" \
  --region ap-northeast-2

# 기존 서비스 업데이트 (이미 배포되어 있는 경우)
aws ecs update-service \
  --cluster your-cluster-name \
  --service panopticon-backend \
  --task-definition panopticon-backend-task \
  --force-new-deployment \
  --region ap-northeast-2
```

## 로컬과 ECS 차이점

### 로컬 (docker-compose)
- Fluent Bit이 별도의 독립 컨테이너로 실행
- `127.0.0.1:24224`로 통신
- 볼륨 마운트로 설정 파일 공유

### ECS (Fargate)
- Fluent Bit이 사이드카 컨테이너로 같은 Task 내에서 실행
- `localhost:24224`로 통신 (같은 네트워크 네임스페이스)
- 설정 파일이 이미지에 포함됨
- Backend가 메인(essential=true), Fluent Bit이 보조(essential=false)

## 트러블슈팅

### 1. Fluent Bit 연결 실패
Backend 컨테이너에서 Fluent Bit에 연결할 수 없는 경우:
- Task Definition에서 `dependsOn` 설정 확인
- Fluent Bit 컨테이너가 먼저 시작되는지 확인

### 2. 로그가 Panopticon에 전송되지 않음
- Fluent Bit 컨테이너 로그 확인: CloudWatch Logs에서 `/ecs/panopticon-backend/fluent-bit` 로그 그룹 확인
- 네트워크 연결 확인: ECS Task의 Security Group에서 아웃바운드 HTTPS(443) 허용되어 있는지 확인
- Panopticon API 엔드포인트 확인: `api.jungle-panopticon.cloud`에 접근 가능한지 확인

### 3. Backend 로그 드라이버 오류
```
fluentd: dial tcp 127.0.0.1:24224: connect: connection refused
```
- `dependsOn` 설정으로 Fluent Bit이 먼저 시작되도록 보장
- Fluent Bit의 `essential: false` 설정으로 사이드카가 죽어도 Task가 유지되도록 설정

### 4. CloudWatch Logs 확인 방법
```bash
# Fluent Bit 로그 확인
aws logs tail /ecs/panopticon-backend --follow --filter-pattern "fluent-bit"

# 특정 Task의 모든 로그 확인
aws logs tail /ecs/panopticon-backend --follow
```

## CI/CD 파이프라인 예시

GitHub Actions 또는 다른 CI/CD 도구를 사용하는 경우:

```yaml
# .github/workflows/deploy-ecs.yml 예시
name: Deploy to ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Fluent Bit image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd panopticon-simulator/docker
          docker build -f Dockerfile.fluentbit -t $ECR_REGISTRY/panopticon/fluent-bit:latest .
          docker push $ECR_REGISTRY/panopticon/fluent-bit:latest

      - name: Build and push Backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd panopticon-simulator/backend
          docker build -t $ECR_REGISTRY/panopticon/backend:latest .
          docker push $ECR_REGISTRY/panopticon/backend:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster your-cluster-name \
            --service panopticon-backend \
            --force-new-deployment
```

## 비용 최적화 팁

1. **Spot 인스턴스 사용**: Fargate Spot을 사용하면 비용을 최대 70% 절감 가능
2. **리소스 최적화**: CPU와 메모리를 실제 사용량에 맞게 조정
3. **로그 보관 기간 설정**: CloudWatch Logs 보관 기간을 적절히 설정 (예: 7일)

```bash
aws logs put-retention-policy \
  --log-group-name /ecs/panopticon-backend \
  --retention-in-days 7
```

## 참고 사항

- Fluent Bit의 `essential: false` 설정으로 Fluent Bit이 실패해도 Backend는 계속 실행됩니다
- Backend의 health check가 있어 비정상 상태 시 자동으로 재시작됩니다
- 로그는 Panopticon ALB와 CloudWatch Logs 두 곳에 모두 기록됩니다 (Fluent Bit 자체 로그는 CloudWatch에만)
