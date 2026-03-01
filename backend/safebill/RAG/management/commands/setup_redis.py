"""
Django Management Command to Setup Redis for RAG
"""

from django.core.management.base import BaseCommand
from RAG.services.redis_cache import RedisCacheManager


class Command(BaseCommand):
    help = 'Setup and test Redis connection for RAG conversation caching'
    
    def handle(self, *args, **options):
        """Execute the command"""
        
        print("\n" + "=" * 80)
        print("RAG REDIS SETUP")
        print("=" * 80 + "\n")
        
        # Initialize Redis manager
        redis_manager = RedisCacheManager()
        
        if redis_manager.is_available:
            print("[OK] Redis is available and connected")
            
            # Get stats
            stats = redis_manager.get_cache_stats()
            print(f"\nCache Statistics:")
            print(f"  Status: {stats.get('status')}")
            print(f"  Used Memory: {stats.get('used_memory_mb', 0)} MB")
            print(f"  Connected Clients: {stats.get('connected_clients', 0)}")
            print(f"  Total Commands: {stats.get('total_commands_processed', 0)}")
            
            print("\n[OK] Redis is ready for conversation caching!")
        else:
            print("[WARNING] Redis is not available")
            print("\nTo enable Redis caching:")
            print("1. Install Redis: pip install redis")
            print("2. Add to .env:")
            print("   REDIS_HOST=localhost")
            print("   REDIS_PORT=6379")
            print("   REDIS_DB=0")
            print("3. Start Redis server (if not running)")
            print("\nNote: The system will work without Redis, but caching will be disabled")
        
        print("\n" + "=" * 80 + "\n")
