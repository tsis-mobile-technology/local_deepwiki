import redis
import json
from typing import Optional, Dict, Any

class CacheService:
    def __init__(self, host: str, port: int, db: int = 0):
        self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve a value from the cache."""
        value = self.client.get(key)
        return json.loads(value) if value else None

    def set(self, key: str, value: Dict[str, Any], expiration_secs: int = 3600):
        """Set a value in the cache with an expiration time."""
        self.client.set(key, json.dumps(value), ex=expiration_secs)
