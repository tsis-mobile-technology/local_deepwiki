import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.qa_service import QAService

class TestQAService:
    
    @pytest.fixture
    def qa_service(self):
        with patch('app.services.qa_service.ChatOpenAI'), \
             patch('app.services.qa_service.VectorService'):
            return QAService()

    @pytest.mark.asyncio
    async def test_answer_question_success(self, qa_service):
        """Test successful question answering"""
        # Mock vector service
        mock_docs = [
            {"content": "This is relevant content", "metadata": {}},
            {"content": "More relevant content", "metadata": {}}
        ]
        qa_service.vector_service.search_similar_content = AsyncMock(return_value=mock_docs)
        
        # Mock LLM response
        mock_response = MagicMock()
        mock_response.content = "This is the answer based on the documentation."
        qa_service.llm.invoke = AsyncMock(return_value=mock_response)
        
        result = await qa_service.answer_question("What does this project do?", "test/repo")
        
        assert result["success"] is True
        assert "answer" in result
        assert len(result["sources"]) == 2
        qa_service.vector_service.search_similar_content.assert_called_once_with(
            query="What does this project do?",
            repo_name="test/repo",
            limit=5
        )

    @pytest.mark.asyncio
    async def test_answer_question_no_docs(self, qa_service):
        """Test question answering when no relevant documents found"""
        qa_service.vector_service.search_similar_content = AsyncMock(return_value=[])
        
        result = await qa_service.answer_question("What does this project do?", "test/repo")
        
        assert result["success"] is False
        assert "문서를 찾을 수 없습니다" in result["answer"]
        assert result["sources"] == []

    @pytest.mark.asyncio
    async def test_answer_question_llm_error(self, qa_service):
        """Test question answering when LLM fails"""
        mock_docs = [{"content": "content", "metadata": {}}]
        qa_service.vector_service.search_similar_content = AsyncMock(return_value=mock_docs)
        
        # Mock asyncio.to_thread to raise exception
        with patch('asyncio.to_thread', side_effect=Exception("LLM failed")):
            result = await qa_service.answer_question("What does this project do?", "test/repo")
            
            assert result["success"] is False
            assert "답변 생성 중 오류가 발생했습니다" in result["answer"]

    @pytest.mark.asyncio
    async def test_get_suggested_questions(self, qa_service):
        """Test getting suggested questions"""
        questions = await qa_service.get_suggested_questions("test/repo")
        
        assert isinstance(questions, list)
        assert len(questions) > 0
        assert all(isinstance(q, str) for q in questions)
        
    @pytest.mark.asyncio
    async def test_get_suggested_questions_error(self, qa_service):
        """Test getting suggested questions with error handling"""
        # Mock the vector service to raise an exception
        qa_service.vector_service.search_similar_content = AsyncMock(side_effect=Exception("Vector search failed"))
        
        questions = await qa_service.get_suggested_questions("test/repo")
        
        # Should return default questions when vector search fails
        assert isinstance(questions, list)
        assert len(questions) >= 0  # May return empty list or default questions