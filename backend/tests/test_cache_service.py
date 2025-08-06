import pytest
from unittest.mock import MagicMock
from app.services.cache_service import CacheService

@pytest.fixture
def mock_redis_client():
    return MagicMock()

@pytest.fixture
def cache_service(mock_redis_client):
    service = CacheService(host="localhost", port=6379, db=0)
    service.client = mock_redis_client  # Inject the mock client
    return service

def test_set_and_get_cache(cache_service, mock_redis_client):
    key = "test_key"
    value = {"data": "test_value"}
    expiration_secs = 60

    cache_service.set(key, value, expiration_secs)
    mock_redis_client.set.assert_called_once_with(key, '{"data": "test_value"}', ex=expiration_secs)

    mock_redis_client.get.return_value = '{"data": "test_value"}'
    retrieved_value = cache_service.get(key)
    mock_redis_client.get.assert_called_once_with(key)
    assert retrieved_value == value

def test_get_non_existent_key(cache_service, mock_redis_client):
    key = "non_existent_key"
    mock_redis_client.get.return_value = None
    retrieved_value = cache_service.get(key)
    assert retrieved_value is None

def test_set_with_default_expiration(cache_service, mock_redis_client):
    key = "default_exp_key"
    value = {"data": "default_exp_value"}
    
    cache_service.set(key, value)
    mock_redis_client.set.assert_called_once_with(key, '{"data": "default_exp_value"}', ex=3600)
