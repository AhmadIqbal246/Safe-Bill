import redis.asyncio as redis
import hashlib
import json
from app.core.config import settings


class CacheService:
    """
    Redis-based cache for RAG responses.
    Automatically stores answers and serves them for repeated questions.
    """
    
    def __init__(self):
        self.enabled = False
        self.client = None
        self.default_ttl = settings.CACHE_TTL_SECONDS  # Configurable via .env
        self._connect()
    
    def _connect(self):
        """Try to connect to Redis. If unavailable, caching is silently disabled."""
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=2  # Don't hang if Redis isn't running
            )
            self.enabled = True
            print(f"✅ Cache: Redis connected at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except Exception as e:
            self.enabled = False
            print(f"⚠️ Cache: Redis unavailable ({e}). Running without cache.")
    
    def _make_key(self, query: str) -> str:
        """
        Creates a unique cache key from the query text.
        Normalizes the query (lowercase, trim) so 'How do payments work?' 
        and 'how do payments work?' hit the same cache entry.
        """
        normalized = query.lower().strip()
        query_hash = hashlib.md5(normalized.encode()).hexdigest()
        return f"rag:response:{query_hash}"
    
    async def get(self, query: str) -> str | None:
        """
        Check if we have a cached answer for this query.
        Returns the cached answer string, or None if not found.
        """
        if not self.enabled:
            return None
        
        try:
            key = self._make_key(query)
            cached = await self.client.get(key)
            if cached:
                print(f"⚡ CACHE HIT: '{query[:50]}...'")
                return cached
            print(f"🔍 CACHE MISS: '{query[:50]}...'")
            return None
        except Exception as e:
            print(f"⚠️ Cache read error: {e}")
            return None
    
    async def set(self, query: str, response: str) -> None:
        """
        Store a query-response pair in the cache.
        Automatically expires after self.default_ttl seconds.
        """
        if not self.enabled or not response.strip():
            return
        
        try:
            key = self._make_key(query)
            await self.client.setex(key, self.default_ttl, response)
            print(f"💾 CACHED: '{query[:50]}...' (TTL: {self.default_ttl}s)")
        except Exception as e:
            print(f"⚠️ Cache write error: {e}")
    
    async def clear_all(self) -> int:
        """
        Clears ALL cached RAG responses. 
        Call this after re-ingesting documents to ensure fresh answers.
        Returns the number of keys deleted.
        """
        if not self.enabled:
            return 0
        
        try:
            keys = []
            async for key in self.client.scan_iter(match="rag:response:*"):
                keys.append(key)
            
            if keys:
                deleted = await self.client.delete(*keys)
                print(f"🗑️ CACHE CLEARED: {deleted} entries removed")
                return deleted
            return 0
        except Exception as e:
            print(f"⚠️ Cache clear error: {e}")
            return 0
    
    async def get_stats(self) -> dict:
        """
        Returns cache statistics for debugging/monitoring.
        """
        if not self.enabled:
            return {"enabled": False, "total_entries": 0, "entries": []}
        
        try:
            entries = []
            async for key in self.client.scan_iter(match="rag:response:*"):
                ttl = await self.client.ttl(key)
                value = await self.client.get(key)
                entries.append({
                    "key": key,
                    "answer_preview": value[:100] + "..." if value and len(value) > 100 else value,
                    "expires_in_seconds": ttl
                })
            
            return {
                "enabled": True,
                "total_entries": len(entries),
                "entries": entries
            }
        except Exception as e:
            return {"enabled": False, "error": str(e), "total_entries": 0, "entries": []}
    
    async def is_healthy(self) -> bool:
        """Quick health check — can we talk to Redis?"""
        if not self.enabled:
            return False
        try:
            return await self.client.ping()
        except:
            return False


cache_service = CacheService()
