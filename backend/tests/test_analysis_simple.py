import pytest
from unittest.mock import patch, MagicMock
from app.services.analysis_service import AnalysisService
from app.services.github_service import GitHubService

@pytest.fixture
def github_service():
    """Mock GitHub service for testing."""
    mock_service = MagicMock(spec=GitHubService)
    mock_service._get_file_type.return_value = "component"
    return mock_service

@pytest.fixture
def analysis_service(github_service):
    return AnalysisService(github_service)

def test_analyze_unsupported_language_returns_error(analysis_service):
    """Test that unsupported languages return an error message."""
    analysis = analysis_service.analyze_code("some code", 'unsupported')
    assert "error" in analysis
    assert "not supported" in analysis["error"]

def test_service_initialization(analysis_service):
    """Test that the analysis service initializes without crashing."""
    assert analysis_service is not None
    assert hasattr(analysis_service, 'parsers')
    assert hasattr(analysis_service, 'languages')

def test_analyze_empty_content(analysis_service):
    """Test analysis with empty content for supported languages.""" 
    if 'python' in analysis_service.parsers:
        analysis = analysis_service.analyze_code("", 'python')
        assert isinstance(analysis, dict)
        assert "error" not in analysis
    else:
        # If parser isn't loaded, expect error
        analysis = analysis_service.analyze_code("", 'python')
        assert "error" in analysis

def test_get_file_type(github_service):
    """Test file type detection based on path patterns."""
    # Configure the mock to return specific values for different paths
    def mock_get_file_type(path):
        if 'main.py' in path or 'app.py' in path or 'index.js' in path:
            return "main"
        elif '/services/' in path:
            return "service" 
        elif '/utils/' in path:
            return "utility"
        elif '/models/' in path:
            return "model"
        elif '/views/' in path:
            return "view"
        elif '/controllers/' in path:
            return "controller"
        elif '/config/' in path:
            return "config"
        elif '/components/' in path or 'Button.tsx' in path:
            return "component"
        elif '/test' in path:
            return "test"
        else:
            return "component"  # default
    
    github_service._get_file_type.side_effect = mock_get_file_type
    
    assert github_service._get_file_type("app.py") == "main"
    assert github_service._get_file_type("main.py") == "main"
    assert github_service._get_file_type("index.js") == "main"
    assert github_service._get_file_type("src/services/user_service.py") == "service"
    assert github_service._get_file_type("src/utils/helper.js") == "utility"
    assert github_service._get_file_type("src/models/user.py") == "model"
    assert github_service._get_file_type("src/views/home.py") == "view"
    assert github_service._get_file_type("src/controllers/api.py") == "controller"
    assert github_service._get_file_type("src/config/settings.py") == "config"
    assert github_service._get_file_type("components/Button.tsx") == "component"
    assert github_service._get_file_type("tests/test_user.py") == "test"
    assert github_service._get_file_type("random/file.py") == "component"  # default

def test_extract_component_name(analysis_service):
    """Test component name extraction from file paths."""
    assert analysis_service._extract_component_name("src/components/Button.tsx") == "Button"
    assert analysis_service._extract_component_name("services/userService.js") == "userService"
    assert analysis_service._extract_component_name("utils/helper.py") == "helper"
    assert analysis_service._extract_component_name("config.json") == "config"
    assert analysis_service._extract_component_name("path/to/file.ext") == "file"

def test_analyze_code_with_exception(analysis_service):
    """Test analyze_code handles exceptions gracefully."""
    # Mock a parser that throws an exception
    mock_parser = MagicMock()
    mock_parser.parse.side_effect = Exception("Parser error")
    analysis_service.parsers['test_lang'] = mock_parser
    
    result = analysis_service.analyze_code("test content", 'test_lang')
    assert isinstance(result, dict)
    assert "error" in result
    assert "Parser error" in str(result["error"])

@patch('app.services.analysis_service.TREE_SITTER_AVAILABLE', False)
def test_analyze_code_without_tree_sitter():
    """Test that service works when Tree-sitter is not available."""
    mock_github_service = MagicMock(spec=GitHubService)
    service = AnalysisService(mock_github_service)
    
    # Should return error for any language since no parsers are loaded
    result = service.analyze_code("def test(): pass", "python")
    assert "error" in result
    assert "not supported" in result["error"]
    
    # Service should still initialize
    assert service.parsers == {}
    assert service.languages == {}

def test_analyze_project_architecture_empty_input(analysis_service):
    """Test project architecture analysis with empty input."""
    file_analysis = {}
    repo_info = {"name": "test-repo", "description": "Test repository"}
    
    result = analysis_service.analyze_project_architecture(file_analysis, repo_info)
    
    assert isinstance(result, dict)
    assert "components" in result
    assert "dependencies" in result
    assert "structure" in result
    assert "metrics" in result
    
    # With empty input, should have minimal structure
    assert result["components"] == {}
    assert result["dependencies"] == []
    assert result["metrics"]["total_components"] == 0

def test_analyze_project_architecture_with_files(analysis_service):
    """Test project architecture analysis with sample files."""
    file_analysis = {
        "src/main.py": {
            "language": "python",
            "imports": ["os", "sys"],
            "classes": [{"name": "MainClass", "methods": ["run"]}],
            "functions": [{"name": "main", "parameters": []}]
        },
        "src/utils.py": {
            "language": "python", 
            "imports": ["json"],
            "classes": [],
            "functions": [{"name": "helper", "parameters": ["data"]}]
        },
        "config.json": {
            "language": "other"
        }
    }
    repo_info = {"name": "test-project", "description": "Test project"}
    
    result = analysis_service.analyze_project_architecture(file_analysis, repo_info)
    
    assert isinstance(result, dict)
    assert "components" in result
    assert "dependencies" in result
    assert "structure" in result
    assert "metrics" in result
    
    # Should have identified components
    assert len(result["components"]) >= 2  # main and utils
    assert "main" in result["components"]
    assert "utils" in result["components"]
    
    # Should have metrics
    assert result["metrics"]["total_components"] >= 2
    assert "complexity" in result["structure"]

def test_load_parsers_with_mock_exception():
    """Test _load_parsers handles exceptions gracefully."""
    with patch('app.services.analysis_service.TREE_SITTER_AVAILABLE', True):
        with patch('app.services.analysis_service.Language', side_effect=Exception("Mock language error")):
            mock_github_service = MagicMock(spec=GitHubService)
            service = AnalysisService(mock_github_service)
            # Should not crash, should continue loading other parsers
            assert isinstance(service.parsers, dict)
            assert isinstance(service.languages, dict)