import pytest
from unittest.mock import patch, MagicMock
from app.services.github_service import GitHubService
from github import Auth

@patch('app.services.github_service.Github')
@pytest.mark.asyncio
async def test_get_repository_structure(MockGithub):
    """Tests the repository structure analysis with a mocked GitHub API."""
    mock_github_instance = MockGithub.return_value
    
    mock_repo = MagicMock()
    mock_repo.name = "test-repo"
    mock_repo.description = "A test repository"
    mock_repo.language = "Python"
    mock_repo.get_topics.return_value = ["test", "ai"]
    mock_repo.default_branch = "main"

    mock_branch = MagicMock()
    mock_commit = MagicMock()
    mock_commit.sha = "abcdef123456"
    mock_branch.commit = mock_commit
    mock_repo.get_branch.return_value = mock_branch

    mock_file = MagicMock()
    mock_file.path = "src/main.py"
    mock_file.type = "file"
    mock_file.size = 1024
    mock_file.sha = "fedcba654321"
    mock_repo.get_contents.side_effect = [[mock_file], []]

    mock_github_instance.get_repo.return_value = mock_repo

    service = GitHubService(github_token="fake_token")

    structure = await service.get_repository_structure("owner/repo")

    assert structure["name"] == "test-repo"
    assert structure["main_language"] == "Python"
    assert "src/main.py" in structure["files"]
    assert structure["commit_hash"] == "abcdef123456"
    
    MockGithub.assert_called_once()
    mock_github_instance.get_repo.assert_called_once_with("owner/repo")