import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.vector_service import VectorService

class TestVectorService:
    
    @pytest.fixture
    def vector_service(self):
        with patch('app.services.vector_service.create_client') as mock_create_client, \
             patch('app.services.vector_service.OpenAIEmbeddings') as mock_embeddings, \
             patch('app.services.vector_service.RecursiveCharacterTextSplitter') as mock_splitter:
            
            # Setup proper mock instances
            mock_supabase = MagicMock()
            mock_create_client.return_value = mock_supabase
            
            mock_embeddings_instance = MagicMock()
            mock_embeddings.return_value = mock_embeddings_instance
            
            mock_splitter_instance = MagicMock()
            mock_splitter.return_value = mock_splitter_instance
            
            service = VectorService()
            service.supabase = mock_supabase
            service.embeddings = mock_embeddings_instance
            service.text_splitter = mock_splitter_instance
            
            return service

    @pytest.mark.asyncio
    async def test_store_document_success(self, vector_service):
        """Test successful document storage"""
        # Mock dependencies
        vector_service.text_splitter.split_text.return_value = ["chunk1", "chunk2"]
        vector_service.embeddings.embed_query = AsyncMock(return_value=[0.1, 0.2, 0.3])
        
        mock_result = MagicMock()
        mock_result.data = [{"id": "1"}, {"id": "2"}]
        vector_service.supabase.table.return_value.insert.return_value.execute.return_value = mock_result
        
        result = await vector_service.store_document("test/repo", "test documentation", "abc123")
        
        assert result["success"] is True
        assert result["chunks_stored"] == 2
        vector_service.text_splitter.split_text.assert_called_once_with("test documentation")

    @pytest.mark.asyncio
    async def test_store_document_failure(self, vector_service):
        """Test document storage failure"""
        vector_service.text_splitter.split_text.return_value = ["chunk1"]
        
        # Mock asyncio.to_thread to raise exception
        with patch('asyncio.to_thread', side_effect=Exception("Embedding failed")):
            result = await vector_service.store_document("test/repo", "test documentation", "abc123")
            
            assert result["success"] is False
            assert "error" in result

    @pytest.mark.asyncio
    async def test_search_similar_content_success(self, vector_service):
        """Test successful similarity search"""
        with patch('asyncio.to_thread') as mock_to_thread:
            mock_to_thread.return_value = [0.1, 0.2, 0.3]
            
            # Mock RPC call result
            mock_result = MagicMock()
            mock_result.data = [
                {"content": "relevant content", "metadata": {}, "repo_name": "test/repo"}
            ]
            
            mock_execute = MagicMock(return_value=mock_result)
            mock_rpc = MagicMock(return_value=MagicMock(execute=mock_execute))
            vector_service.supabase.rpc = mock_rpc
            
            result = await vector_service.search_similar_content("test query", "test/repo")
            
            assert len(result) == 1
            assert result[0]["content"] == "relevant content"

    @pytest.mark.asyncio
    async def test_search_similar_content_empty(self, vector_service):
        """Test similarity search with no results"""
        with patch('asyncio.to_thread') as mock_to_thread:
            mock_to_thread.return_value = [0.1, 0.2, 0.3]
            
            mock_result = MagicMock()
            mock_result.data = []
            
            mock_execute = MagicMock(return_value=mock_result)
            mock_rpc = MagicMock(return_value=MagicMock(execute=mock_execute))
            vector_service.supabase.rpc = mock_rpc
            
            result = await vector_service.search_similar_content("test query", "test/repo")
            
            assert result == []

    @pytest.mark.asyncio
    async def test_delete_repo_documents(self, vector_service):
        """Test document deletion"""
        mock_result = MagicMock()
        mock_result.data = [{"id": "1"}, {"id": "2"}]
        vector_service.supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result
        
        result = await vector_service.delete_repo_documents("test/repo", "abc123")
        
        assert result["success"] is True
        assert result["deleted_count"] == 2

    def test_create_documents_table_sql(self, vector_service):
        """Test SQL generation for documents table"""
        sql = vector_service.create_documents_table_sql()
        
        # Check for actual table name used in implementation
        assert "CREATE TABLE IF NOT EXISTS github_documents" in sql
        assert "embedding VECTOR(1536)" in sql
        assert "CREATE INDEX IF NOT EXISTS github_documents_embedding_idx" in sql