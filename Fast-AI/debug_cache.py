import asyncio
import json
from app.db.redis_client import cache_service

async def inspect_cache():
    print("\n" + "="*50)
    print("🧠 SAFE-BILL CACHE INSPECTOR")
    print("="*50)
    
    stats = await cache_service.get_stats()
    
    if not stats["enabled"]:
        print("❌ Redis is not connected or initialized.")
        return

    print(f"📊 Total Entries: {stats['total_entries']}")
    print("-" * 50)

    if stats["total_entries"] == 0:
        print("📭 The cache is currently empty.")
    else:
        for entry in stats["entries"]:
            # Extract the raw hash key from the "rag:response:hash" format
            short_key = entry["key"].replace("rag:response:", "")
            
            print(f"🔑 Key Hash: {short_key}")
            print(f"⏳ Expires In: {entry['expires_in_seconds']} seconds")
            print(f"📝 Answer Preview: \n   \"{entry['answer_preview']}\"")
            print("-" * 50)

    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(inspect_cache())
