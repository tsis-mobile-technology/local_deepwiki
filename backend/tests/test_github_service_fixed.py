import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from app.services.github_service import GitHubService

@pytest.mark.asyncio
@patch('app.services.github_service.httpx.AsyncClient')
async def test_get_repository_structure(MockAsyncClient):
    """Tests the repository structure analysis with properly configured async mocks."""
    
    # Create mock client instance
    mock_client_instance = AsyncMock()
    MockAsyncClient.return_value = mock_client_instance
    
    # Create mock responses with proper structure
    mock_repo_response = MagicMock()
    mock_repo_response.status_code = 200
    mock_repo_response.json = AsyncMock(return_value={
        "name": "test-repo",
        "description": "A test repository",
        "language": "Python",
        "topics": ["test", "ai"],
        "default_branch": "main"
    })
    mock_repo_response.raise_for_status = MagicMock()

    mock_branch_response = MagicMock()
    mock_branch_response.status_code = 200
    mock_branch_response.json = AsyncMock(return_value={
        "commit": {"sha": "abcdef123456"}
    })
    mock_branch_response.raise_for_status = MagicMock()

    mock_tree_response = MagicMock()
    mock_tree_response.status_code = 200
    mock_tree_response.json = AsyncMock(return_value={
        "tree": [
            {"path": "src/main.py", "type": "blob", "size": 1024, "sha": "fedcba654321"}
        ]
    })
    mock_tree_response.raise_for_status = MagicMock()

    # Configure the get method to return awaitable responses
    mock_client_instance.get = AsyncMock(side_effect=[
        mock_repo_response,
        mock_branch_response,
        mock_tree_response
    ])

    service = GitHubService(github_token="fake_token")
    structure = await service.get_repository_structure("owner/repo")

    # Verify results
    assert structure["name"] == "test-repo"
    assert structure["main_language"] == "Python"
    assert "src/main.py" in structure["files"]
    assert structure["commit_hash"] == "abcdef123456"
    
    # Verify method calls
    assert mock_client_instance.get.call_count == 3
    
    # Verify URLs called
    calls = mock_client_instance.get.call_args_list
    expected_urls = [
        "https://api.github.com/repos/owner/repo",
        "https://api.github.com/repos/owner/repo/branches/main",
        "https://api.github.com/repos/owner/repo/git/trees/abcdef123456?recursive=1"
    ]
    
    for i, call in enumerate(calls):
        assert call[0][0] == expected_urls[i]