# DeepWiki Docker 배포 가이드

이 가이드는 Docker를 사용하여 DeepWiki 애플리케이션을 배포하는 방법을 설명합니다.

## 전제 조건

- Docker 및 Docker Compose 설치
- 필요한 API 키들 (GitHub Token, OpenAI API Key, Supabase 설정)

## 설정

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 실제 값으로 수정하세요:

```bash
cp .env.example .env
```

`.env` 파일에서 다음 값들을 설정하세요:
- `GITHUB_TOKEN`: GitHub Personal Access Token
- `OPENAI_API_KEY`: OpenAI API Key
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase Anonymous Key

### 2. Supabase 데이터베이스 설정

Supabase에서 Vector Extension을 활성화하고 documents 테이블을 생성하세요:

```sql
-- Vector Extension 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents 테이블 생성 (backend/app/services/vector_service.py 참조)
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    repo_name TEXT NOT NULL,
    commit_hash TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repo_name, commit_hash, chunk_index)
);

CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## 개발 환경 실행

### 빠른 시작

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 상태 확인
docker-compose ps
```

### 개별 서비스 실행

```bash
# Redis만 시작
docker-compose up -d redis

# Backend만 시작
docker-compose up -d backend

# Frontend만 시작
docker-compose up -d frontend
```

### 애플리케이션 접속

- **프론트엔드**: http://localhost
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs
- **Redis**: localhost:6379

## 프로덕션 환경 배포

### 프로덕션 모드로 실행

```bash
# 프로덕션 환경으로 시작
docker-compose -f docker-compose.prod.yml up -d

# 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

### SSL 인증서 설정 (선택사항)

```bash
# nginx/ssl 디렉토리 생성
mkdir -p nginx/ssl

# Let's Encrypt를 사용한 SSL 인증서 생성 예시
# (실제 도메인이 필요합니다)
certbot certonly --standalone -d your-domain.com
```

## 유용한 Docker 명령어

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

### 컨테이너 관리
```bash
# 서비스 중지
docker-compose down

# 볼륨까지 삭제
docker-compose down -v

# 이미지 재빌드
docker-compose build --no-cache

# 특정 서비스만 재시작
docker-compose restart backend
```

### 데이터베이스/캐시 관리
```bash
# Redis CLI 접속
docker-compose exec redis redis-cli

# Redis 데이터 확인
docker-compose exec redis redis-cli keys "*"

# 캐시 초기화
docker-compose exec redis redis-cli flushall
```

## 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   - 기본 포트 (80, 8000, 6379)가 사용 중인 경우 docker-compose.yml에서 포트를 변경하세요

2. **환경 변수 오류**
   - `.env` 파일이 올바르게 설정되었는지 확인하세요
   - API 키들이 유효한지 확인하세요

3. **빌드 오류**
   - Docker 캐시를 초기화하고 재빌드: `docker-compose build --no-cache`

4. **네트워크 연결 문제**
   - 모든 서비스가 같은 네트워크에 있는지 확인하세요
   - Health check 상태를 확인하세요: `docker-compose ps`

### 로그 분석
```bash
# 에러 로그만 필터링
docker-compose logs backend | grep -i error

# 실시간 로그 모니터링
docker-compose logs -f --tail=50 backend
```

## 성능 최적화

### 프로덕션 설정
- Docker 이미지 크기 최적화
- Multi-stage 빌드 사용
- 적절한 리소스 제한 설정
- 로그 로테이션 설정

### 모니터링
```bash
# 컨테이너 리소스 사용량 확인
docker stats

# 디스크 사용량 확인
docker system df
```

## 보안 고려사항

1. **환경 변수 보안**
   - `.env` 파일을 git에 커밋하지 마세요
   - 프로덕션에서는 Docker secrets 사용 고려

2. **네트워크 보안**
   - 불필요한 포트 노출 최소화
   - 내부 네트워크 사용

3. **컨테이너 보안**
   - non-root 사용자로 실행
   - 최소 권한 원칙 적용