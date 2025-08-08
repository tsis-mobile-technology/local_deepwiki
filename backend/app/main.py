from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import asyncio
from datetime import datetime

from app.services.github_service import GitHubService
from app.services.analysis_service import AnalysisService
from app.services.llm_service import LLMService
from app.services.cache_service import CacheService
from app.services.vector_service import VectorService
from app.services.qa_service import QAService
from app.config import settings
from supabase import create_client, Client

app = FastAPI()



# CORS 미들웨어 설정
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://localhost",
    "https://localhost:443",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase 클라이언트 초기화
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Initialize services
github_service = GitHubService(settings.GITHUB_TOKEN)
analysis_service = AnalysisService(github_service)
llm_service = LLMService(settings.OPENAI_API_KEY)
cache_service = CacheService(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
vector_service = VectorService()
qa_service = QAService()

# Global repository history (in production, this should use a database)
repo_history: List[Dict[str, Any]] = []

class AnalyzeRequest(BaseModel):
    repo_url: str

class AskRequest(BaseModel):
    question: str
    repo_name: str

async def update_task_status(task_id: str, status: str, data: Dict = None, error: str = None):
    """Update task status in the database."""
    update_data = {"status": status}
    if data:
        update_data["result"] = data
    if error:
        update_data["error"] = error
    
    await asyncio.to_thread(supabase.table("analysis_tasks").update(update_data).eq("id", task_id).execute)

async def run_analysis_pipeline(task_id: str, repo_url: str):
    """The actual analysis pipeline that runs in the background."""
    try:
        repo_name = "/".join(repo_url.split("/")[-2:])
        await update_task_status(task_id, "fetching_structure")
        
        structure = await github_service.get_repository_structure(repo_name)
        commit_hash = structure["commit_hash"]
        cache_key = f"{repo_name}:{commit_hash}"

        # Update commit_hash in the task table
        await asyncio.to_thread(supabase.table("analysis_tasks").update({"commit_hash": commit_hash}).eq("id", task_id).execute)

        cached_result = cache_service.get(cache_key)
        if cached_result:
            await update_task_status(task_id, "completed", data=cached_result)
            return

        await update_task_status(task_id, "analyzing_files")
        priority_files = github_service.get_priority_files(structure["files"])[:5]
        file_analysis = {}
        readme_content = ""
        for file_path in priority_files:
            content = await github_service.get_file_content(repo_name, file_path)
            if file_path.lower().endswith('.md'):
                readme_content = content
            lang = structure["files"][file_path]["type"]
            if lang in ['python', 'javascript', 'typescript']:
                 file_analysis[file_path] = analysis_service.analyze_code(content, lang)

        await update_task_status(task_id, "generating_documentation")
        repo_info = {
            "name": structure["name"],
            "description": structure.get("description", "No description available"),
            "main_language": structure["main_language"]
        }
        
        architecture_analysis = analysis_service.analyze_project_architecture(file_analysis, repo_info)
        documentation = llm_service.run_documentation_pipeline(repo_info, readme_content, file_analysis)
        
        result = {
            "result": documentation,
            "architecture": architecture_analysis
        }
        
        await update_task_status(task_id, "storing_embeddings", data=result)
        cache_service.set(cache_key, result)
        
        store_result = await vector_service.store_document(repo_name, documentation, commit_hash)
        
        if not store_result["success"]:
            print(f"Warning: Failed to store embeddings: {store_result.get('error', 'Unknown error')}")
        
        await update_task_status(task_id, "completed", data=result)

    except Exception as e:
        print(f"Error during analysis pipeline for task {task_id}: {e}")
        await update_task_status(task_id, "failed", error=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/analyze")
async def analyze_repository(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    repo_name = "/".join(request.repo_url.split("/")[-2:])
    
    # Create a new task in the database
    response = await asyncio.to_thread(supabase.table("analysis_tasks").insert({
        "repo_name": repo_name,
        "status": "pending"
    }).execute)
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create analysis task.")

    task_id = response.data[0]["id"]
    
    # Note: In production, this should be stored in database
    repo_history.append({
        "repo_name": repo_name,
        "timestamp": datetime.now().isoformat()
    })
    
    background_tasks.add_task(run_analysis_pipeline, task_id, request.repo_url)
    return {"task_id": task_id}

@app.get("/api/result/{task_id}")
async def get_result(task_id: str):
    response = await asyncio.to_thread(supabase.table("analysis_tasks").select("*").eq("id", task_id).execute)
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data[0]

@app.get("/api/analyses")
async def get_analyses_history() -> List[Dict[str, Any]]:
    """Get the history of all analysis tasks."""
    response = await asyncio.to_thread(supabase.table("analysis_tasks")\
        .select("id, repo_name, status, created_at, updated_at")\
        .order("created_at", desc=True)\
        .limit(50)\
        .execute)
    
    if not response.data:
        return []
    return response.data

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

@app.get("/api/suggestions/{repo_name:path}")
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
        response = await asyncio.to_thread(supabase.table("analysis_tasks").select("status, result").eq("id", task_id).execute)
        if not response.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = response.data[0]
        if task.get("status") != "completed":
            return {"status": "not_ready", "message": "Analysis not completed yet"}
        
        architecture = task.get("result", {}).get("architecture", {})
        if not architecture or "error" in architecture:
            raise HTTPException(status_code=500, detail="Architecture analysis failed or not found in result")
        
        return {
            "status": "success",
            "architecture": architecture
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting architecture data: {str(e)}")
