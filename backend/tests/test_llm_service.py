import pytest
from unittest.mock import patch, MagicMock
from app.services.llm_service import LLMService
from langchain_core.messages import AIMessage

@pytest.fixture
def llm_service():
    return LLMService(openai_api_key="fake_key")

@patch('langchain_core.runnables.base.RunnableSequence.invoke')
def test_run_documentation_pipeline(mock_invoke, llm_service):
    """Tests the full documentation pipeline, ensuring each step is called correctly."""
    # Configure the mock to return different content for each call
    mock_invoke.side_effect = [
        AIMessage(content="Generated Summary"),
        AIMessage(content="Generated Structure Analysis"),
        AIMessage(content="Final Documentation")
    ]

    repo_info = {"name": "test-repo"}
    readme_content = "This is a README."
    file_analysis = {"main.py": {"classes": []}}

    # Run the entire pipeline
    final_doc = llm_service.run_documentation_pipeline(repo_info, readme_content, file_analysis)

    # Assert the final output
    assert final_doc == "Final Documentation"

    # Assert that the chain was invoked three times (for each step in the pipeline)
    assert mock_invoke.call_count == 3

    # Optionally, inspect the arguments of each call
    # Call 1: Summarization
    assert "readme_content" in mock_invoke.call_args_list[0].args[0]
    # Call 2: Structure Analysis
    assert "file_analysis_json" in mock_invoke.call_args_list[1].args[0]
    # Call 3: Draft Generation
    assert "summary" in mock_invoke.call_args_list[2].args[0]
    assert mock_invoke.call_args_list[2].args[0]["summary"] == "Generated Summary"
    assert mock_invoke.call_args_list[2].args[0]["structure_analysis"] == "Generated Structure Analysis"