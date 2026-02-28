# RAG System - Quick Reference

## 🚀 Start Using

### Interactive Chat
```bash
python manage.py interactive_chat
```

### REST API
```bash
curl -X POST http://localhost:8000/api/rag/search/ \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I refund?"}'
```

### Admin Dashboard
```
http://localhost:8000/admin/rag/
```

---

## 💬 Interactive Chat Commands

| Command | Description |
|---------|-------------|
| `>>> query text` | Ask a question |
| `>>> history` | Show all previous messages |
| `>>> clear` | Clear conversation |
| `>>> exit` | Exit chat |

---

## 📊 Example Conversation

```
>>> How do I refund?

[RESPONSE]
To request a refund, you need to submit a dispute through the Dispute Resolution System...

[RETRIEVED CHUNKS]
1. Dispute Resolution System (Section: Using This Feature)
   Score: 0.6129
   Text: **What you can do:** - Submit disputes...

>>> What if the seller doesn't respond?

[ENRICHED QUERY] What happens if the seller doesn't respond to a refund dispute request?

[RESPONSE]
If the seller doesn't respond, the mediator will review the evidence...

>>> history

[Shows all previous messages with scores]

>>> exit
```

---

## 🔌 API Endpoints

### Search
```
POST /api/rag/search/
{
  "query": "How do I refund?",
  "save_history": true
}
```

### Get Conversations
```
GET /api/rag/conversations/
```

### Get Conversation History
```
GET /api/rag/history/{conversation_id}/
```

### Search History
```
POST /api/rag/search-history/
{
  "query": "refund"
}
```

### Delete Conversation
```
DELETE /api/rag/history/{conversation_id}/
```

---

## 🔧 Management Commands

```bash
# Embed chunks
python manage.py embed_chunks

# Search chunks
python manage.py search_chunks "query text"

# Setup Redis
python manage.py setup_redis

# Interactive chat
python manage.py interactive_chat

# Create superuser
python manage.py createsuperuser
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `RAG/models.py` | Database models |
| `RAG/views.py` | REST API endpoints |
| `RAG/admin.py` | Admin dashboard |
| `RAG/services/conversation_manager.py` | Conversation management |
| `RAG/services/llm_service.py` | LLM integration |
| `RAG/services/redis_cache.py` | Redis caching |
| `RAG/management/commands/interactive_chat.py` | Terminal chat |

---

## 🎯 Features

✅ Multi-turn conversations
✅ Query enrichment with history
✅ LLM response generation
✅ Authenticated + anonymous users
✅ PostgreSQL + Redis storage
✅ REST API
✅ Admin dashboard
✅ Performance tracking

---

## ⚡ Performance

| Operation | Time |
|-----------|------|
| First query | 10-15s |
| Cached query | 2-5s |
| Embedding | 8-10s |
| Search | 0.5-2s |
| LLM response | 1-3s |

---

## 🔐 Environment Variables

```
GOOGLE_API_KEY=your_api_key
PINECONE_API_KEY=your_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📚 Documentation

- `SYSTEM_SUMMARY.md` - Complete overview
- `HYBRID_APPROACH_GUIDE.md` - User types
- `INTERACTIVE_CHAT_GUIDE.md` - Terminal chat
- `CONVERSATION_SETUP.md` - Setup guide
- `API_REFERENCE.md` - API docs

---

## 🧪 Test It

### Anonymous User
```bash
curl -X POST http://localhost:8000/api/rag/search/ \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I refund?"}'
```

### Interactive Chat
```bash
python manage.py interactive_chat
>>> How do I refund?
>>> What if the seller doesn't respond?
>>> history
>>> exit
```

### Admin
```
http://localhost:8000/admin/rag/
Login: admin / (your password)
```

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not found | Check GOOGLE_API_KEY |
| Connection refused | Start Redis server |
| Index not found | Run `python manage.py embed_chunks` |
| EOF error | Run in terminal, not IDE |

---

## 🎉 You're Ready!

Start the interactive chat:
```bash
python manage.py interactive_chat
```

Or use the REST API:
```bash
curl -X POST http://localhost:8000/api/rag/search/ \
  -H "Content-Type: application/json" \
  -d '{"query": "your question here"}'
```

Enjoy! 🚀
