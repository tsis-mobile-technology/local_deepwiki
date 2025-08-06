from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from typing import Dict, Any

from app.services.github_service import GitHubService
from app.services.analysis_service import AnalysisService
from app.services.llm_service import LLMService
from app.services.cache_service import CacheService
from app.services.vector_service import VectorService
from app.services.qa_service import QAService
from app.config import settings

app = FastAPI()

# CORS 미들웨어 설정
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for task status and results
tasks: Dict[str, Dict[str, Any]] = {}

# Initialize services
github_service = GitHubService(settings.GITHUB_TOKEN)
analysis_service = AnalysisService()
llm_service = LLMService(settings.OPENAI_API_KEY)
cache_service = CacheService(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
vector_service = VectorService()
qa_service = QAService()

class AnalyzeRequest(BaseModel):
    repo_url: str

class AskRequest(BaseModel):
    question: str
    repo_name: str

async def run_analysis_pipeline(task_id: str, repo_url: str):
    """The actual analysis pipeline that runs in the background."""
    try:
        repo_name = "/".join(repo_url.split("/")[-2:])
        
        tasks[task_id]["status"] = "fetching_structure"
        structure = github_service._get_repository_structure_sync(repo_name)
        commit_hash = structure["commit_hash"]
        cache_key = f"{repo_name}:{commit_hash}"

        # Check cache first
        cached_result = cache_service.get(cache_key)
        if cached_result:
            tasks[task_id].update(cached_result)
            return

        tasks[task_id]["status"] = "analyzing_files"
        priority_files = github_service.get_priority_files(structure["files"])[:5]
        file_analysis = {}
        readme_content = ""
        for file_path in priority_files:
            content = github_service._get_file_content_sync(repo_name, file_path)
            if file_path.lower().endswith('.md'):
                readme_content = content
            lang = structure["files"][file_path]["type"]
            if lang in ['python', 'javascript']:
                 file_analysis[file_path] = analysis_service.analyze_code(content, lang)

        # 아키텍처 분석 수행
        architecture_analysis = analysis_service.analyze_project_architecture(
            file_analysis, repo_info
        )

        tasks[task_id]["status"] = "generating_documentation"
        repo_info = {
            "name": structure["name"],
            "description": structure.get("description", "No description available"),
            "main_language": structure["main_language"]
        }
        documentation = llm_service.run_documentation_pipeline(repo_info, readme_content, file_analysis)
        
        result = {
            "status": "completed", 
            "result": documentation,
            "architecture": architecture_analysis
        }
        tasks[task_id].update(result)
        cache_service.set(cache_key, result)
        
        # 문서를 Vector Store에 저장
        tasks[task_id]["status"] = "storing_embeddings"
        store_result = await vector_service.store_document(
            repo_name, documentation, commit_hash
        )
        
        if not store_result["success"]:
            print(f"Warning: Failed to store embeddings: {store_result.get('error', 'Unknown error')}")
        
        tasks[task_id]["status"] = "completed"

    except Exception as e:
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/analyze")
async def analyze_repository(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "pending"}
    # Use asyncio.create_task since the function is now async
    import asyncio
    asyncio.create_task(run_analysis_pipeline(task_id, request.repo_url))
    return {"task_id": task_id}

@app.get("/api/result/{task_id}")
async def get_result(task_id: str):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/ask")
async def ask_question(request: AskRequest):
    """사용자 질문에 대해 RAG를 사용하여 답변 제공"""
    try:
        result = await qa_service.answer_question(
            question=request.question,
            repo_name=request.repo_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

@app.get("/api/suggestions/{repo_name}")
async def get_suggested_questions(repo_name: str):
    """리포지토리에 대한 추천 질문들 반환"""
    try:
        suggestions = await qa_service.get_suggested_questions(repo_name)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting suggestions: {str(e)}")

@app.get("/api/architecture/{task_id}")
async def get_architecture_data(task_id: str):
    """특정 태스크의 아키텍처 분석 결과 반환"""
    try:
        task = tasks.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task.get("status") != "completed":
            return {"status": "not_ready", "message": "Analysis not completed yet"}
        
        architecture = task.get("architecture", {})
        if not architecture or "error" in architecture:
            raise HTTPException(status_code=500, detail="Architecture analysis failed")
        
        return {
            "status": "success",
            "architecture": architecture
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting architecture data: {str(e)}")
