import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock

from app.main import app, cache_service, analysis_service

client = TestClient(app)

@patch('app.main.supabase')
@patch('app.main.run_analysis_pipeline')
def test_analyze_repository_endpoint(mock_run_pipeline, mock_supabase):
    """Test the /api/analyze endpoint, ensuring the background task is called."""
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'test-task-id'}]
    response = client.post("/api/analyze", json={"repo_url": "https://github.com/owner/repo"})
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    mock_run_pipeline.assert_called_once_with(data['task_id'], "https://github.com/owner/repo")

@pytest.mark.asyncio
@patch('app.main.supabase')
@patch.object(cache_service, 'get')
@patch.object(cache_service, 'set')
@patch('app.main.github_service')
@patch('app.main.llm_service')
@patch('app.main.analysis_service')
async def test_run_analysis_pipeline_with_cache(mock_analysis, mock_llm, mock_github, mock_cache_set, mock_cache_get, mock_supabase):
    """Test the analysis pipeline with and without cache."""
    from app.main import run_analysis_pipeline
    task_id = "test-cache-miss"
    repo_url = "https://github.com/owner/repo"

    # --- Test Cache Miss ---
    mock_cache_get.return_value = None # Simulate cache miss
    
    # Properly mock GitHub service structure
    mock_structure = {
        "name": "repo", 
        "commit_hash": "123", 
        "files": {"main.py": {"type": "python", "size": 100}}, 
        "main_language": "Python", 
        "description": "Test repo"
    }
    mock_github.get_repository_structure = AsyncMock(return_value=mock_structure)
    mock_github.get_priority_files = MagicMock(return_value=["main.py"])
    mock_github.get_file_content = AsyncMock(return_value="# Test content")
    
    # Mock LLM service
    mock_llm.run_documentation_pipeline.return_value = "Fresh Documentation"
    
    # Mock Supabase operations
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

    await run_analysis_pipeline(task_id, repo_url)

    mock_cache_get.assert_called_with("owner/repo:123")
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.assert_called()
    mock_cache_set.assert_called_once()

    # --- Test Cache Hit ---
    task_id_hit = "test-cache-hit"
    cached_data = {"status": "completed", "result": "Cached Documentation"}
    mock_cache_get.return_value = cached_data # Simulate cache hit
    mock_llm.run_documentation_pipeline.reset_mock() # Reset mock for the next call
    mock_cache_set.reset_mock()

    await run_analysis_pipeline(task_id_hit, repo_url)

    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.assert_called()
    # Ensure the LLM pipeline was NOT called for a cache hit
    mock_llm.run_documentation_pipeline.assert_not_called()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}