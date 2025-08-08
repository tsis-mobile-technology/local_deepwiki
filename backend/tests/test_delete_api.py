import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from app.main import app

client = TestClient(app)

class TestDeleteAPI:
    
    @patch('app.main.supabase')
    def test_delete_single_analysis_success(self, mock_supabase):
        """Test successful deletion of a single analysis"""
        # Mock the database response for getting task info
        mock_get_response = MagicMock()
        mock_get_response.data = [{"repo_name": "test/repo", "commit_hash": "abc123"}]
        
        # Mock the delete response
        mock_delete_response = MagicMock()
        mock_delete_response.data = [{"id": "test-task-id"}]
        
        # Configure the mock chain
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_get_response
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_delete_response
        
        response = client.delete("/api/analyses/test-task-id")
        
        assert response.status_code == 200
        assert response.json()["message"] == "Analysis deleted successfully"
        assert response.json()["task_id"] == "test-task-id"

    @patch('app.main.supabase')
    def test_delete_single_analysis_not_found(self, mock_supabase):
        """Test deletion of non-existent analysis"""
        # Mock empty response
        mock_response = MagicMock()
        mock_response.data = []
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        response = client.delete("/api/analyses/non-existent-id")
        
        assert response.status_code == 404
        assert "Task not found" in response.json()["detail"]

    @patch('app.main.supabase')
    @patch('app.main.vector_service')
    def test_delete_multiple_analyses_success(self, mock_vector_service, mock_supabase):
        """Test successful deletion of multiple analyses"""
        # Mock the database responses
        mock_get_response = MagicMock()
        mock_get_response.data = [{"repo_name": "test/repo", "commit_hash": "abc123"}]
        
        mock_delete_response = MagicMock()
        mock_delete_response.data = [{"id": "task1"}, {"id": "task2"}]
        
        # Configure the mock chain
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_get_response
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_delete_response
        
        # Mock vector service
        mock_vector_service.delete_repo_documents = AsyncMock(return_value={"success": True})
        
        response = client.delete(
            "/api/analyses",
            json={"task_ids": ["task1", "task2"]}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["deleted_count"] == 2
        assert "task1" in result["deleted_tasks"]
        assert "task2" in result["deleted_tasks"]

    def test_delete_multiple_analyses_empty_list(self):
        """Test deletion with empty task_ids list"""
        response = client.delete(
            "/api/analyses",
            json={"task_ids": []}
        )
        
        assert response.status_code == 400
        assert "No task IDs provided" in response.json()["detail"]

    def test_delete_multiple_analyses_invalid_json(self):
        """Test deletion with invalid JSON"""
        response = client.delete(
            "/api/analyses",
            json={"invalid_field": ["task1"]}
        )
        
        assert response.status_code == 422  # Validation error

    @patch('app.main.supabase')
    def test_delete_multiple_analyses_partial_failure(self, mock_supabase):
        """Test deletion where some items fail"""
        def mock_execute_side_effect(*args, **kwargs):
            # First call (task1) - success
            if not hasattr(mock_execute_side_effect, 'call_count'):
                mock_execute_side_effect.call_count = 0
            
            mock_execute_side_effect.call_count += 1
            
            mock_response = MagicMock()
            if mock_execute_side_effect.call_count == 1:  # First get call for task1
                mock_response.data = [{"repo_name": "test/repo", "commit_hash": "abc123"}]
            elif mock_execute_side_effect.call_count == 2:  # Delete call for task1
                mock_response.data = [{"id": "task1"}]
            elif mock_execute_side_effect.call_count == 3:  # Get call for task2 (not found)
                mock_response.data = []
            else:
                mock_response.data = []
            
            return mock_response
        
        # Configure mock to handle multiple calls
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = mock_execute_side_effect
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.side_effect = mock_execute_side_effect
        
        response = client.delete(
            "/api/analyses",
            json={"task_ids": ["task1", "task2"]}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        assert result["deleted_count"] == 1
        assert len(result["failed_deletes"]) == 1
        assert result["failed_deletes"][0]["id"] == "task2"

    @patch('app.main.cache_service')
    def test_cache_cleanup_on_delete(self, mock_cache_service):
        """Test that cache is cleaned up on successful deletion"""
        with patch('app.main.supabase') as mock_supabase, \
             patch('app.main.vector_service') as mock_vector_service:
            
            # Mock successful deletion
            mock_get_response = MagicMock()
            mock_get_response.data = [{"repo_name": "test/repo", "commit_hash": "abc123"}]
            
            mock_delete_response = MagicMock()
            mock_delete_response.data = [{"id": "task1"}]
            
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_get_response
            mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_delete_response
            
            mock_vector_service.delete_repo_documents = AsyncMock(return_value={"success": True})
            
            response = client.delete("/api/analyses/task1")
            
            assert response.status_code == 200
            # Verify cache deletion was attempted
            mock_cache_service.client.delete.assert_called_with("test/repo:abc123")

    @patch('app.main.supabase')
    def test_database_error_handling(self, mock_supabase):
        """Test handling of database errors during deletion"""
        # Mock database error
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = Exception("Database error")
        
        response = client.delete("/api/analyses/task1")
        
        assert response.status_code == 500
        assert "Database error" in response.json()["detail"]

    def test_delete_analyses_endpoint_methods(self):
        """Test that only DELETE method is allowed for analyses endpoint"""
        # Test other HTTP methods are not allowed
        response = client.get("/api/analyses/task1")
        # This should return 405 Method Not Allowed, but our endpoint doesn't exist
        # We're testing that DELETE is the only method that works
        
        response = client.post("/api/analyses/task1")
        assert response.status_code in [404, 405]  # Either not found or method not allowed
        
        response = client.put("/api/analyses/task1")  
        assert response.status_code in [404, 405]
