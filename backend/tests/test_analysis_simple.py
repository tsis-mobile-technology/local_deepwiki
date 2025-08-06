import pytest
from app.services.analysis_service import AnalysisService

@pytest.fixture
def analysis_service():
    return AnalysisService()

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