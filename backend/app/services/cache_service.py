import redis
import json
from typing import Optional, Dict, Any, List

class CacheService:
    def __init__(self, host: str, port: int, db: int = 0):
        self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve a value from the cache."""
        try:
            value = self.client.get(key)
            return json.loads(value) if value else None
        except (redis.RedisError, json.JSONDecodeError) as e:
            print(f"Error getting cache key {key}: {e}")
            return None

    def set(self, key: str, value: Dict[str, Any], expiration_secs: int = 3600):
        """Set a value in the cache with an expiration time."""
        try:
            self.client.set(key, json.dumps(value), ex=expiration_secs)
            return True
        except (redis.RedisError, json.JSONEncodeError) as e:
            print(f"Error setting cache key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete a specific key from the cache."""
        try:
            result = self.client.delete(key)
            return result > 0  # Returns True if key was deleted, False if key didn't exist
        except redis.RedisError as e:
            print(f"Error deleting cache key {key}: {e}")
            return False

    def delete_multiple(self, keys: List[str]) -> int:
        """Delete multiple keys from the cache. Returns number of keys deleted."""
        if not keys:
            return 0
        
        try:
            result = self.client.delete(*keys)
            return result
        except redis.RedisError as e:
            print(f"Error deleting multiple cache keys: {e}")
            return 0

    def exists(self, key: str) -> bool:
        """Check if a key exists in the cache."""
        try:
            return self.client.exists(key) > 0
        except redis.RedisError as e:
            print(f"Error checking cache key existence {key}: {e}")
            return False

    def get_keys_pattern(self, pattern: str) -> List[str]:
        """Get all keys matching a pattern."""
        try:
            return self.client.keys(pattern)
        except redis.RedisError as e:
            print(f"Error getting keys with pattern {pattern}: {e}")
            return []

    def clear_repo_cache(self, repo_name: str) -> int:
        """Clear all cache entries for a specific repository."""
        try:
            pattern = f"{repo_name}:*"
            keys = self.get_keys_pattern(pattern)
            if keys:
                return self.delete_multiple(keys)
            return 0
        except Exception as e:
            print(f"Error clearing repo cache for {repo_name}: {e}")
            return 0

    def get_cache_info(self) -> Dict[str, Any]:
        """Get cache information and statistics."""
        try:
            info = self.client.info()
            return {
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory", 0),
                "used_memory_human": info.get("used_memory_human", "0B"),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "total_commands_processed": info.get("total_commands_processed", 0)
            }
        except redis.RedisError as e:
            print(f"Error getting cache info: {e}")
            return {}

    def flush_all(self) -> bool:
        """Clear all cache entries. Use with caution!"""
        try:
            self.client.flushdb()
            return True
        except redis.RedisError as e:
            print(f"Error flushing cache: {e}")
            return False

    def ping(self) -> bool:
        """Test Redis connection."""
        try:
            return self.client.ping()
        except redis.RedisError as e:
            print(f"Redis connection failed: {e}")
            return False
