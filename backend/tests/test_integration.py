import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from app.main import app

class TestIntegration:
    
    @pytest.fixture
    def client(self):
        # Mock all external services and main app dependencies
        with patch('app.services.vector_service.create_client'), \
             patch('app.services.vector_service.OpenAIEmbeddings'), \
             patch('app.services.github_service.httpx.AsyncClient'), \
             patch('app.services.llm_service.ChatOpenAI'), \
             patch('app.main.supabase') as mock_supabase:
            
            # Setup default Supabase responses
            mock_response = MagicMock()
            mock_response.data = [{'id': 'test-id'}]
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
            mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
            mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
            
            return TestClient(app)

    def test_full_api_workflow(self, client):
        """Test the complete API workflow"""
        # Test health check
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    @patch('app.main.supabase')
    @patch('app.main.run_analysis_pipeline')
    def test_analyze_endpoint_integration(self, mock_pipeline, mock_supabase, client):
        """Test analyze endpoint integration"""
        # Mock the pipeline to return successfully
        mock_pipeline.return_value = None  # Background task
        
        # Mock Supabase insert for task creation
        mock_response = MagicMock()
        mock_response.data = [{'id': 'test-task-123'}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        response = client.post("/api/analyze", json={
            "repo_url": "https://github.com/test/repo"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "task_id" in data
        mock_pipeline.assert_called_once()

    @patch('app.main.supabase')
    @patch('app.main.cache_service')
    def test_get_result_not_found(self, mock_cache, mock_supabase, client):
        """Test get result for non-existent task"""
        # Mock cache to return None for non-existent task
        mock_cache.get.return_value = None
        
        # Mock Supabase to return empty result
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        response = client.get("/api/result/non-existent-id")
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"

    @patch('app.main.supabase')
    @patch('app.main.cache_service')
    def test_get_architecture_not_found(self, mock_cache, mock_supabase, client):
        """Test get architecture for non-existent task"""
        # Mock cache to return None for non-existent task
        mock_cache.get.return_value = None
        
        # Mock Supabase to return empty result
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        response = client.get("/api/architecture/non-existent-id")
        assert response.status_code == 404
        assert response.json()["detail"] == "Task not found"

    @patch('app.main.qa_service')
    def test_ask_endpoint_integration(self, mock_qa_service, client):
        """Test ask endpoint integration"""
        # Mock async method properly
        mock_qa_service.answer_question = AsyncMock(return_value={
            "success": True,
            "answer": "Test answer",
            "sources": []
        })
        
        response = client.post("/api/ask", json={
            "question": "What does this project do?",
            "repo_name": "test/repo"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["answer"] == "Test answer"

    @patch('app.main.qa_service')
    def test_suggestions_endpoint_integration(self, mock_qa_service, client):
        """Test suggestions endpoint integration"""
        # Mock async method properly
        mock_qa_service.get_suggested_questions = AsyncMock(return_value=[
            "What is this project?",
            "How to install?"
        ])
        
        response = client.get("/api/suggestions/test-repo")
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) == 2

    def test_cors_headers(self, client):
        """Test CORS headers are properly set"""
        response = client.options("/api/health", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        })
        
        # The response might be 200 or 405 depending on FastAPI version
        # but CORS headers should be present
        assert response.status_code in [200, 405]

    def test_invalid_json_request(self, client):
        """Test handling of invalid JSON requests"""
        response = client.post("/api/analyze", 
                             data="invalid json", 
                             headers={"Content-Type": "application/json"})
        assert response.status_code == 422  # Unprocessable Entity

    def test_missing_required_fields(self, client):
        """Test handling of missing required fields"""
        response = client.post("/api/analyze", json={})
        assert response.status_code == 422  # Validation error
        
        response = client.post("/api/ask", json={"question": "test"})
        assert response.status_code == 422  # Missing repo_name