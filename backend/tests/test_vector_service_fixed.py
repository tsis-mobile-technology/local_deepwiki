import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.vector_service import VectorService

class TestVectorServiceFixed:
    
    @pytest.fixture
    def vector_service(self):
        with patch('app.services.vector_service.create_client') as mock_create_client, \
             patch('app.services.vector_service.OpenAIEmbeddings') as mock_embeddings, \
             patch('app.services.vector_service.RecursiveCharacterTextSplitter') as mock_splitter:
            
            # Setup mock Supabase client with proper chain
            mock_supabase = MagicMock()
            mock_create_client.return_value = mock_supabase
            
            # Setup mock embeddings
            mock_embeddings_instance = AsyncMock()
            mock_embeddings.return_value = mock_embeddings_instance
            
            # Setup mock text splitter
            mock_splitter_instance = MagicMock()
            mock_splitter.return_value = mock_splitter_instance
            
            service = VectorService()
            service.supabase = mock_supabase
            service.embeddings = mock_embeddings_instance
            service.text_splitter = mock_splitter_instance
            
            return service

    @pytest.mark.asyncio
    async def test_store_document_success(self, vector_service):
        """Test successful document storage with proper mock configuration"""
        # Setup mocks
        vector_service.text_splitter.split_text.return_value = ["chunk1", "chunk2"]
        vector_service.embeddings.embed_query = AsyncMock(return_value=[0.1, 0.2, 0.3])
        
        # Setup Supabase table chain mock
        mock_result = MagicMock()
        mock_result.data = [{"id": "1"}, {"id": "2"}]
        
        mock_execute = MagicMock(return_value=mock_result)
        mock_insert = MagicMock(return_value=MagicMock(execute=mock_execute))
        mock_table = MagicMock(return_value=MagicMock(insert=mock_insert))
        
        vector_service.supabase.table = mock_table
        
        result = await vector_service.store_document("test/repo", "test documentation", "abc123")
        
        assert result["success"] is True
        assert result["chunks_stored"] == 2
        vector_service.text_splitter.split_text.assert_called_once_with("test documentation")

    @pytest.mark.asyncio 
    async def test_search_similar_content_success(self, vector_service):
        """Test similarity search with RPC call mocking"""
        # Use asyncio.to_thread side_effect to properly mock the async call
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
            
            # Verify RPC was called with correct parameters
            mock_rpc.assert_called_once_with('match_documents', {
                'query_embedding': [0.1, 0.2, 0.3],
                'match_threshold': 0.7,
                'match_count': 5,
                'p_repo_name': "test/repo"
            })

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

    def test_create_documents_table_sql_correct_name(self, vector_service):
        """Test SQL generation uses correct table name"""
        sql = vector_service.create_documents_table_sql()
        
        # Test should check for actual table name used in implementation
        assert "CREATE TABLE IF NOT EXISTS github_documents" in sql
        assert "embedding VECTOR(1536)" in sql
        assert "CREATE INDEX IF NOT EXISTS github_documents_embedding_idx" in sql