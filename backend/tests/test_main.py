import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app, tasks, cache_service, analysis_service

client = TestClient(app)

client = TestClient(app)

@patch('app.main.run_analysis_pipeline')
def test_analyze_repository_endpoint(mock_run_pipeline):
    """Test the /api/analyze endpoint, ensuring the background task is called."""
    response = client.post("/api/analyze", json={"repo_url": "https://github.com/owner/repo"})
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    mock_run_pipeline.assert_called_once_with(data['task_id'], "https://github.com/owner/repo")

@patch.object(cache_service, 'get')
@patch.object(cache_service, 'set')
@patch('app.main.github_service')
@patch('app.main.llm_service')
@patch('app.main.analysis_service')
def test_run_analysis_pipeline_with_cache(mock_analysis, mock_llm, mock_github, mock_cache_set, mock_cache_get):
    """Test the analysis pipeline with and without cache."""
    from app.main import run_analysis_pipeline
    task_id = "test-cache-miss"
    repo_url = "https://github.com/owner/repo"
    tasks[task_id] = {"status": "pending"}

    # --- Test Cache Miss ---
    mock_cache_get.return_value = None # Simulate cache miss
    mock_github._get_repository_structure_sync.return_value = {
        "name": "repo", "commit_hash": "123", "files": {}, "main_language": "Python", "description": "Test repo"
    }
    mock_llm.run_documentation_pipeline.return_value = "Fresh Documentation"

    run_analysis_pipeline(task_id, repo_url)

    mock_cache_get.assert_called_once_with("owner/repo:123")
    assert tasks[task_id].get("result") == "Fresh Documentation"
    assert tasks[task_id]["status"] == "completed"
    mock_cache_set.assert_called_once()

    # --- Test Cache Hit ---
    task_id_hit = "test-cache-hit"
    tasks[task_id_hit] = {"status": "pending"}
    cached_data = {"status": "completed", "result": "Cached Documentation"}
    mock_cache_get.return_value = cached_data # Simulate cache hit
    mock_llm.run_documentation_pipeline.reset_mock() # Reset mock for the next call

    run_analysis_pipeline(task_id_hit, repo_url)

    assert tasks[task_id_hit]["result"] == "Cached Documentation"
    # Ensure the LLM pipeline was NOT called for a cache hit
    mock_llm.run_documentation_pipeline.assert_not_called()

    # Clean up
    del tasks[task_id]
    del tasks[task_id_hit]

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}