# Hybrid Approach: Authenticated + Anonymous Users

## Overview

The RAG conversation history system now supports **both authenticated and anonymous users** using a hybrid approach:

- **Authenticated Users**: Conversations linked to user account
- **Anonymous Users**: Conversations linked to session ID (no login required)

## How It Works

### Authenticated Users
```
User Login
    ↓
[user_id = request.user.id]
    ↓
[Save conversation with user_id]
    ↓
[Retrieve history using user_id]
```

### Anonymous Users
```
First Request (No Login)
    ↓
[Generate session ID: request.session['rag_session_id']]
    ↓
[Save conversation with anonymous_user_id]
    ↓
[Retrieve history using anonymous_user_id]
    ↓
[Session persists for 24 hours]
```

## Database Schema

### ChatbotHistoryConversation Table

```sql
CREATE TABLE chatbot_history_conversation (
    id BIGINT PRIMARY KEY,
    conversation_id UUID NOT NULL,
    
    -- User identification (one must be set)
    user_id INT NULL,  -- Authenticated user
    anonymous_user_id VARCHAR(255) NULL,  -- Anonymous user
    is_authenticated BOOLEAN DEFAULT FALSE,
    
    -- Conversation content
    user_query TEXT NOT NULL,
    response_text TEXT NULL,
    
    -- Embeddings and retrieval
    query_embedding JSONB NULL,
    retrieved_chunks JSONB DEFAULT '[]',
    
    -- Context and metadata
    context_summary TEXT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    -- Performance metrics
    response_time_ms INT DEFAULT 0,
    embedding_time_ms INT DEFAULT 0,
    search_time_ms INT DEFAULT 0,
    
    -- Quality metrics
    avg_chunk_score FLOAT DEFAULT 0.0,
    max_chunk_score FLOAT DEFAULT 0.0,
    
    FOREIGN KEY (user_id) REFERENCES auth_user(id),
    INDEX idx_user_conversation (user_id, conversation_id),
    INDEX idx_anonymous_conversation (anonymous_user_id, conversation_id),
    INDEX idx_is_authenticated (is_authenticated)
);
```

## API Usage

### 1. Anonymous User - First Request

**Request** (No authentication):
```bash
curl -X POST http://localhost:8000/api/rag/search/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I refund?",
    "save_history": true
  }'
```

**Response**:
```json
{
  "success": true,
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "is_authenticated": false,
  "query": "How do I refund?",
  "count": 5,
  "results": [...]
}
```

**Behind the scenes**:
1. System detects no authentication
2. Creates session ID: `rag_session_id`
3. Saves conversation with `anonymous_user_id`
4. Sets `is_authenticated = false`

### 2. Anonymous User - Retrieve History

**Request** (Same session, no login):
```bash
curl -X GET http://localhost:8000/api/rag/conversations/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

**Response**:
```json
{
  "success": true,
  "is_authenticated": false,
  "count": 3,
  "conversations": [
    {
      "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
      "message_count": 5,
      "first_message": "How do I refund?",
      "last_message_at": "2025-12-07T20:35:00Z",
      "avg_score": 0.65
    }
  ]
}
```

### 3. Authenticated User - Search

**Request** (With authentication):
```bash
curl -X POST http://localhost:8000/api/rag/search/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "payment processing",
    "save_history": true
  }'
```

**Response**:
```json
{
  "success": true,
  "conversation_id": "660e8400-e29b-41d4-a716-446655440001",
  "is_authenticated": true,
  "query": "payment processing",
  "count": 5,
  "results": [...]
}
```

**Behind the scenes**:
1. System detects authentication
2. Uses `user_id` from authenticated user
3. Saves conversation with `user_id`
4. Sets `is_authenticated = true`

## Data Persistence

### Anonymous Users
- **Duration**: 24 hours (Django session timeout)
- **Storage**: PostgreSQL + Redis
- **Loss**: After session expires or browser clears cookies
- **Use Case**: Temporary exploration without account

### Authenticated Users
- **Duration**: Permanent (until deleted)
- **Storage**: PostgreSQL + Redis
- **Loss**: Only if manually deleted
- **Use Case**: Persistent conversation history

## Migration Path

### Anonymous → Authenticated

When an anonymous user creates an account:

```python
# Option 1: Manual migration
conversation = ChatbotHistoryConversation.objects.get(
    anonymous_user_id='old_session_id'
)
conversation.user_id = new_user.id
conversation.anonymous_user_id = None
conversation.is_authenticated = True
conversation.save()

# Option 2: Automatic on login
# Add signal to migrate conversations when user logs in
@receiver(user_logged_in)
def migrate_anonymous_conversations(sender, request, user, **kwargs):
    session_id = request.session.get('rag_session_id')
    if session_id:
        ChatbotHistoryConversation.objects.filter(
            anonymous_user_id=session_id
        ).update(
            user_id=user.id,
            anonymous_user_id=None,
            is_authenticated=True
        )
```

## Code Examples

### Python - Anonymous User

```python
import requests

# First request - anonymous
response = requests.post(
    'http://localhost:8000/api/rag/search/',
    json={'query': 'How do I refund?'},
    cookies={'sessionid': 'your_session_id'}
)
data = response.json()
print(f"Is authenticated: {data['is_authenticated']}")  # False
print(f"Conversation ID: {data['conversation_id']}")

# Second request - same session
response = requests.get(
    'http://localhost:8000/api/rag/conversations/',
    cookies={'sessionid': 'your_session_id'}
)
conversations = response.json()['conversations']
print(f"Found {len(conversations)} conversations")
```

### Python - Authenticated User

```python
import requests

headers = {'Authorization': f'Bearer {token}'}

# Search
response = requests.post(
    'http://localhost:8000/api/rag/search/',
    json={'query': 'payment processing'},
    headers=headers
)
data = response.json()
print(f"Is authenticated: {data['is_authenticated']}")  # True

# Get all conversations
response = requests.get(
    'http://localhost:8000/api/rag/conversations/',
    headers=headers
)
conversations = response.json()['conversations']
```

### JavaScript - Anonymous User

```javascript
// First request - anonymous
const response = await fetch('http://localhost:8000/api/rag/search/', {
  method: 'POST',
  credentials: 'include',  // Include cookies
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({query: 'How do I refund?'})
});
const data = await response.json();
console.log(`Is authenticated: ${data.is_authenticated}`);  // false

// Second request - same session (cookies auto-included)
const response2 = await fetch('http://localhost:8000/api/rag/conversations/', {
  credentials: 'include'
});
const conversations = await response2.json();
```

## Admin Interface

Access: `http://localhost:8000/admin/rag/chatbothistoryconversation/`

**Filters**:
- By user (authenticated)
- By is_authenticated (True/False)
- By date
- By score

**Search**:
- Search by query text
- Search by username (authenticated users)

## Session Configuration

Django session settings in `settings.py`:

```python
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_SECURE = True  # HTTPS only
SESSION_COOKIE_HTTPONLY = True
```

## Best Practices

### For Anonymous Users
1. ✅ Inform users that history is temporary
2. ✅ Provide "Save Conversation" option before logout
3. ✅ Offer account creation to preserve history
4. ✅ Clear old sessions regularly

### For Authenticated Users
1. ✅ Provide conversation export
2. ✅ Allow conversation deletion
3. ✅ Show conversation metadata
4. ✅ Enable search across all conversations

### For Both
1. ✅ Track `is_authenticated` flag
2. ✅ Return authentication status in responses
3. ✅ Handle session expiration gracefully
4. ✅ Provide clear error messages

## Troubleshooting

### Anonymous User History Not Persisting
```
Issue: Conversations disappear after browser close
Solution: Check SESSION_EXPIRE_AT_BROWSER_CLOSE setting
```

### Session ID Not Found
```
Issue: "No conversation history found" error
Solution: Ensure cookies are enabled and session is active
```

### Can't Retrieve Anonymous Conversations
```
Issue: Empty conversations list for anonymous user
Solution: Check if 'rag_session_id' exists in request.session
```

## Performance Considerations

### Anonymous Users
- **Pros**: No database lookup for user
- **Cons**: Session ID stored in cookies
- **Optimization**: Use Redis for session storage

### Authenticated Users
- **Pros**: Indexed by user_id
- **Cons**: Additional database lookup
- **Optimization**: Cache user conversations in Redis

## Future Enhancements

- [ ] Automatic anonymous → authenticated migration
- [ ] Conversation sharing between users
- [ ] Export conversations to PDF/Word
- [ ] Conversation analytics dashboard
- [ ] Conversation tagging and organization
- [ ] Conversation collaboration

## Summary

The hybrid approach provides:
✅ Flexibility for both authenticated and anonymous users
✅ Persistent storage for authenticated users
✅ Temporary storage for anonymous users
✅ Clear tracking of user type
✅ Easy migration path from anonymous to authenticated
✅ Seamless API experience for both user types
