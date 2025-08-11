# 🚀 DeepWiki 삭제 기능 배포 가이드

## 📋 변경 사항 요약

### 백엔드 변경사항
- ✅ 단일/다중 분석 삭제 API 엔드포인트 추가
- ✅ 캐시 및 벡터 스토어 자동 정리 기능
- ✅ 삭제 관련 에러 처리 및 롤백 메커니즘
- ✅ 테스트 코드 추가

### 프론트엔드 변경사항
- ✅ 선택 모드 토글 기능
- ✅ 다중 선택 및 일괄 삭제 UI
- ✅ 삭제 확인 다이얼로그
- ✅ 로딩 상태 및 에러 처리
- ✅ 테스트 코드 추가

### 데이터베이스 변경사항
- ✅ Supabase 테이블 구조 최적화
- ✅ 인덱스 추가로 성능 향상
- ✅ Vector 검색 함수 개선

## 🔧 단계별 배포 가이드

### Step 1: Supabase 데이터베이스 업데이트

```sql
-- Supabase 대시보드 → SQL Editor에서 실행
-- 1. Vector extension 확인
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 테이블 구조 업데이트 (이미 존재하는 경우 스킵됨)
CREATE TABLE IF NOT EXISTS analysis_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repo_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    commit_hash TEXT,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 성능 최적화 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_repo_name ON analysis_tasks(repo_name);
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_status ON analysis_tasks(status);
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_created_at ON analysis_tasks(created_at DESC);

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analysis_tasks_updated_at 
    BEFORE UPDATE ON analysis_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: 환경 변수 확인

```bash
# .env 파일 확인
cat .env

# 필수 환경 변수들이 설정되어 있는지 확인
# - SUPABASE_URL
# - SUPABASE_ANON_KEY  
# - OPENAI_API_KEY
# - GITHUB_TOKEN (선택사항)
# - REDIS_HOST
# - REDIS_PORT
```

### Step 3: Docker 환경 배포

#### 개발 환경
```bash
# 1. 기존 컨테이너 중지
docker-compose down

# 2. 이미지 재빌드 (변경사항 반영)
docker-compose build --no-cache

# 3. 서비스 시작
docker-compose up -d

# 4. 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend

# 5. 헬스체크
curl http://localhost:8000/api/health
curl http://localhost:3000
```

#### 프로덕션 환경
```bash
# 1. 프로덕션 이미지 빌드
docker-compose -f docker-compose.prod.yml build --no-cache

# 2. 프로덕션 배포
docker-compose -f docker-compose.prod.yml up -d

# 3. 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 4. 로그 모니터링
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 4: 로컬 개발 환경 배포

#### 백엔드
```bash
cd backend

# 1. 가상환경 활성화
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate     # Windows

# 2. 의존성 업데이트
pip install -r requirements.txt

# 3. 테스트 실행
python -m pytest tests/ -v

# 4. 서버 시작
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 프론트엔드
```bash
cd frontend

# 1. 의존성 설치
npm install

# 2. 테스트 실행
npm run test

# 3. 개발 서버 시작
npm run dev
```

## 🧪 배포 후 테스트

### 1. API 테스트
```bash
# 헬스체크
curl http://localhost:8000/api/health

# 분석 기록 조회
curl http://localhost:8000/api/analyses

# 삭제 API 테스트 (예시)
curl -X DELETE "http://localhost:8000/api/analyses" \
  -H "Content-Type: application/json" \
  -d '{"task_ids": ["test-task-id"]}'
```

### 2. 프론트엔드 기능 테스트
1. **http://localhost:3000** 접속
2. **GitHub 리포지토리 분석** 실행
3. **Analysis History** 섹션에서 **편집** 버튼 클릭
4. **항목 선택** 후 **삭제** 기능 테스트
5. **확인 다이얼로그** 동작 확인

### 3. 통합 테스트
```bash
# 백엔드 통합 테스트
cd backend
python -m pytest tests/test_integration.py -v

# 프론트엔드 통합 테스트
cd frontend
npm run test:coverage
```

## 🔍 문제 해결

### 일반적인 문제들

#### 1. 데이터베이스 연결 오류
```bash
# Supabase 연결 확인
curl -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  "YOUR_SUPABASE_URL/rest/v1/analysis_tasks?select=id&limit=1"
```

#### 2. Redis 연결 오류
```bash
# Redis 컨테이너 상태 확인
docker-compose exec redis redis-cli ping

# Redis 로그 확인
docker-compose logs redis
```

#### 3. 프론트엔드 빌드 오류
```bash
# 의존성 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm run dev -- --force
```

#### 4. API 응답 오류
```bash
# 백엔드 로그 확인
docker-compose logs backend

# 데이터베이스 테이블 확인
# Supabase Dashboard → Table Editor
```

### 로그 분석
```bash
# 실시간 로그 모니터링
docker-compose logs -f --tail=100

# 특정 서비스 로그
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error

# 컨테이너 상태 확인
docker-compose ps
docker stats
```

## 📊 성능 모니터링

### 1. 응답 시간 체크
```bash
# API 응답 시간 측정
time curl http://localhost:8000/api/analyses

# 삭제 성능 테스트
time curl -X DELETE "http://localhost:8000/api/analyses" \
  -H "Content-Type: application/json" \
  -d '{"task_ids": ["id1", "id2", "id3"]}'
```

### 2. 리소스 사용량 모니터링
```bash
# Docker 컨테이너 리소스 사용량
docker stats --no-stream

# 디스크 사용량
docker system df

# 로그 파일 크기 체크
du -sh logs/
```

### 3. 데이터베이스 성능
```sql
-- Supabase에서 실행
-- 테이블 크기 확인
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'analysis_tasks';

-- 인덱스 사용량 확인
SELECT 
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE relname = 'analysis_tasks';
```

## 🔒 보안 고려사항

### 1. 환경 변수 보안
```bash
# .env 파일 권한 설정
chmod 600 .env

# Git에서 제외 확인
git check-ignore .env
```

### 2. API 보안
- Rate limiting 확인
- CORS 설정 검증
- 입력 값 검증 테스트

### 3. 데이터베이스 보안
- RLS(Row Level Security) 설정 검토
- 백업 정책 수립
- 접근 권한 관리

## 📈 모니터링 설정

### 1. 로그 수집
```yaml
# docker-compose.yml에 추가
version: '3.8'
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
```

### 2. 헬스체크 설정
```bash
# 헬스체크 스크립트
#!/bin/bash
# health_check.sh

# API 헬스체크
if ! curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "❌ Backend API is down"
    exit 1
fi

# Frontend 헬스체크  
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Frontend is down"
    exit 1
fi

echo "✅ All services are healthy"
```

## 🚀 배포 완료 체크리스트

- [ ] **데이터베이스 마이그레이션** 완료
- [ ] **환경 변수** 설정 확인
- [ ] **Docker 컨테이너** 정상 실행
- [ ] **API 엔드포인트** 응답 확인
- [ ] **프론트엔드** 기능 테스트
- [ ] **삭제 기능** 동작 확인
- [ ] **테스트 스위트** 통과
- [ ] **로그 모니터링** 설정
- [ ] **백업 정책** 수립
- [ ] **문서 업데이트** 완료

## 📞 지원

문제가 발생하면:
1. **로그 확인**: `docker-compose logs`
2. **이슈 생성**: GitHub Issues
3. **문서 참조**: README.md
4. **테스트 실행**: 통합 테스트로 문제 격리

---

**배포 성공!** 🎉 이제 사용자들이 분석 결과를 효율적으로 관리할 수 있습니다.
