# 프로젝트: DeepWiki - AI 기반 GitHub 문서화 시스템 구축

#### **최종 목표**
GitHub 리포지토리 URL을 입력받아, AI가 코드베이스를 심층 분석하고, 사용자가 쉽게 이해할 수 있는 위키 스타일의 인터랙티브 문서를 생성하는 웹 애플리케이션을 구축한다.

#### **기술 스택**
- **Backend**: Python, FastAPI, LangChain, Uvicorn, PyGithub, Tree-sitter
- **Frontend**: React, TypeScript, Axios, react-markdown
- **데이터베이스/캐시**: Supabase (Postgres DB, Vector Store), Redis (결과 캐싱 및 작업 큐)
- **배포**: Docker, Nginx

---

### **프로젝트 실행 계획 (A to Z)**

#### **Phase 1: 프로젝트 기반 구축 및 백엔드 설정 (1주차)**

- [X] **1. 환경 설정 및 프로젝트 구조화**
    - [X] `backend`와 `frontend` 디렉토리를 포함하는 모노레포(Monorepo) 구조 설정.
    - [X] **Backend**: Python 가상환경(`venv`) 설정 및 `requirements.txt` 생성 (fastapi, uvicorn, python-dotenv, langchain, openai, PyGithub, redis, supabase-py 등).
    - [X] **Frontend**: Vite를 사용해 React + TypeScript 프로젝트 생성 (`npm create vite@latest frontend -- --template react-ts`).
- [X] **2. FastAPI 백엔드 기본 골격 구현**
    - [X] `backend/app/main.py` 파일 생성 및 기본 FastAPI 애플리케이션 설정.
    - [X] `GET /api/health` 와 같은 간단한 상태 확인 API 엔드포인트 추가.
    - [X] CORS(Cross-Origin Resource Sharing) 미들웨어 설정하여 프론트엔드와의 통신 허용.
- [X] **3. 핵심 로직 모듈화 및 리팩토링**
    - [X] `github-doc-agent.py`의 코드를 FastAPI 프로젝트 구조에 맞게 리팩토링.
    - [X] `services` 디렉토리 생성:
        - [X] `github_service.py`: GitHub API와 통신하여 파일 구조, 내용, 커밋 정보 등을 가져오는 로직.
        - [X] `analysis_service.py`: 코드 내용을 분석하는 로직 (초기에는 Python `ast`, 추후 Tree-sitter로 확장).
        - [X] `llm_service.py`: `deepwiki-prompts.md` 기반으로 LangChain을 사용하여 LLM과 통신하고 문서를 생성하는 로직.
- [X] **4. TDD 기반 단위 테스트 작성 및 검증**
    - [X] `pytest` 환경 설정 및 테스트 디렉토리 구조 생성.
    - [X] `main.py` API 엔드포인트 테스트 작성.
    - [X] `analysis_service.py` 단위 테스트 작성.
    - [X] `github_service.py` 모킹(Mocking)을 이용한 테스트 작성.
    - [X] `llm_service.py` 모킹(Mocking)을 이용한 테스트 작성.
    - [X] 전체 테스트 통과 확인.

#### **Phase 2: 핵심 분석 엔진 개발 (백엔드) (2-3주차)**

- [X] **1. GitHub 분석 기능 고도화**
    - [X] `github_service.py`에서 리포지토리 클론 또는 파일 다운로드 시 비동기 처리 구현.
    - [X] 주요 파일(README, package.json, requirements.txt 등) 및 우선순위가 높은 소스 코드를 자동으로 식별하는 로직 개선.
    - [X] 다양한 프로그래밍 언어 지원을 위해 `ast` 대신 **Tree-sitter** 라이브러리 도입 계획. 이를 통해 Python 외 JavaScript, TypeScript 등의 구문 분석 정확도 향상.
- [X] **2. LLM 프롬프트 체인 파이프라인 구축**
    - [X] `llm_service.py`에 `deepwiki-prompts.md`의 프롬프트들을 체계적으로 연결하는 파이프라인 구축.
    - [X] **(1단계) 요약**: 주요 파일들(README 등)을 요약하여 기본 컨텍스트 생성.
    - [X] **(2단계) 구조 분석**: Tree-sitter 분석 결과를 바탕으로 전체 아키텍처, 핵심 컴포넌트, 의존성 관계를 파악하는 프롬프트 실행.
    - [X] **(3단계) 문서 초안 생성**: 1, 2단계에서 얻은 정보를 종합하여 `메인 문서 생성 프롬프트`를 통해 전체 문서의 초안 생성.
    - [X] **(4단계) 섹션별 상세화**: 생성된 초안을 각 섹션(개요, 아키텍처 등)으로 나누어, `섹션별 상세 프롬프트`를 통해 내용 보강 및 정교화.
- [X] **3. 메인 API 엔드포인트 설계 및 구현**
    - [X] `POST /api/analyze` 엔드포인트 구현.
    - [X] **Request Body**: `{ "repo_url": "https://github.com/owner/repo" }`
    - [X] **Response Body**: `{ "task_id": "some-unique-id" }` (분석은 시간이 오래 걸리므로 비동기 작업으로 처리).
    - [X] WebSocket 또는 SSE(Server-Sent Events)를 사용하여 프론트엔드에 실시간 분석 진행 상황(예: "리포지토리 클론 중...", "파일 구조 분석 중...", "문서 생성 중...")을 전송하는 기능 추가.
- [X] **4. 결과 캐싱 시스템 도입**
    - [X] Redis를 사용하여 (리포지토리, commit hash) 기준으로 분석 결과를 캐싱.
    - [X] 동일한 리포지토리의 동일한 버전에 대한 요청 시, 재분석 없이 캐시된 결과를 즉시 반환하여 LLM API 비용 절감 및 응답 속도 향상.

#### **Phase 3: 프론트엔드 개발 (React) (3-4주차)**

- [X] **1. UI 컴포넌트 구현**
    - [X] `deepwiki-interface.html`을 기반으로 재사용 가능한 React 컴포넌트 제작.
    - [X] `components` 디렉토리: `Header`, `Sidebar`, `CodeBlock`, `RepoInputForm`, `LoadingSpinner` 등.
    - [X] `pages` 디렉토리: `HomePage`, `DocumentationPage`.
- [X] **2. 상태 관리 및 API 연동**
    - [X] Zustand 또는 Redux Toolkit을 사용하여 전역 상태 관리 (로딩 상태, 에러 상태, 분석 결과 등).
    - [X] `axios`를 사용하여 백엔드 API (`/api/analyze`) 호출 로직 구현.
    - [X] WebSocket/SSE 클라이언트 구현하여 백엔드로부터 실시간 진행 상황을 받아 UI에 표시.
- [X] **3. Markdown 렌더링 및 인터랙션**
    - [X] `react-markdown` 라이브러리를 사용하여 백엔드에서 받은 Markdown 문서를 HTML로 렌더링.
    - [X] `rehype-highlight` 플러그인을 연동하여 코드 블록에 구문 강조(Syntax Highlighting) 적용.
    - [X] `CodeBlock` 컴포넌트에 'Copy' 버튼 기능 및 `[filename:L1-L10]` 형태의 소스 참조를 실제 GitHub 링크로 변환하는 기능 추가.

#### **Phase 4: 고급 기능 추가 및 고도화 (5주차)**

- [X] **1. Supabase 연동 및 인터랙티브 Q&A 기능 구현**
    - [X] Supabase 프로젝트 설정 및 `documents` 테이블 (id, content, embedding, metadata) 생성.
    - [X] 문서 생성이 완료되면, 생성된 문서를 청크(chunk)로 분할하고 Embedding하여 Supabase Vector Store에 저장하는 로직 구현.
    - [X] `POST /api/ask` 엔드포인트 추가.
    - [X] 사용자가 질문을 입력하면, 해당 질문과 관련된 문서 내용을 Supabase Vector Store에서 검색하여 컨텍스트로 삼아 LLM에게 답변을 생성하도록 요청 (RAG - Retrieval-Augmented Generation).
- [X] **2. 시각화 기능 추가**
    - [X] 백엔드 `analysis_service.py`에서 컴포넌트 간의 의존성 관계를 분석하여 JSON 형태로 출력.
    - [X] 프론트엔드에서 Mermaid.js 또는 React Flow 같은 라이브러리를 사용하여 이 데이터를 기반으로 아키텍처 다이어그램을 동적으로 렌더링.

#### **Phase 5: 테스트, 배포 및 최종 완성 (6주차)**

- [X] **1. 컨테이너화**
    - [X] `backend`와 `frontend` 각각에 `Dockerfile` 작성.
    - [X] `docker-compose.yml` 파일을 작성하여 FastAPI, React, Redis, Nginx 컨테이너를 한번에 관리.
- [X] **2. 테스트 및 CI/CD**
    - [X] **Backend**: `pytest`를 사용하여 주요 서비스 로직 및 API 엔드포인트에 대한 단위/통합 테스트 작성.
    - [X] **Frontend**: `Vitest`와 `React Testing Library`를 사용하여 컴포넌트 테스트 작성.
    - [X] GitHub Actions를 사용하여 main 브랜치에 push/merge 시 자동으로 테스트 및 빌드를 수행하는 CI(Continuous Integration) 파이프라인 구축.
- [ ] **3. 배포**
    - [ ] 클라우드 서버(예: AWS EC2, GCP Compute Engine)에 Docker 환경을 구성하고 `docker-compose`를 통해 애플리케이션 배포.
    - [ ] Nginx를 리버스 프록시로 설정하여 API 요청은 FastAPI로, 정적 파일 요청은 React 빌드 결과로 라우팅.
    - [ ] 도메인 연결 및 HTTPS를 위한 SSL 인증서(Let's Encrypt) 설정.
