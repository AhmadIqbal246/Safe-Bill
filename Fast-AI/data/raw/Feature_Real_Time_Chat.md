---
# Document Identity
doc_id: feature_real_time_chat_001
title: Real-Time Chat System
category: Feature
feature: Real-Time Chat

# Audience & Access
user_roles: Seller, Buyer
difficulty: Beginner
prerequisites: [Feature_Project_Management]

# Content Classification
topics: [Chat, Messaging, File Attachments, Conversation History, Unread Messages]
keywords: [chat, message, messaging, real-time, file attachment, conversation]
use_cases: [Project communication, Discussing details, Sharing files, Real-time collaboration]

# Relationships
related_docs: [Feature_Project_Management, Guide_How_To_Use_Chat]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Real-Time Chat System

## Document Metadata
- **Feature**: Real-Time Chat
- **Category**: Feature
- **User Roles**: Seller, Buyer
- **Dependencies**: Project management, user authentication
- **Enabled By Default**: Yes

---

## Quick Summary

Real-Time Chat System enables instant communication between sellers and buyers for each project. Messages are delivered in real-time, conversation history is maintained, and users can share files. The system tracks unread messages and provides a WhatsApp-like contact list showing recent conversations.

**Key Capabilities:**
- Send and receive instant messages
- View full conversation history
- Share file attachments
- Track unread messages
- See last message preview
- Real-time notifications
- Message read status

**Use Cases:**
- Discussing project details
- Sharing files and documents
- Clarifying requirements
- Providing updates
- Resolving issues

---

## How It Works

### Component 1: Real-Time Messaging

**Purpose**: Instant communication between project participants  
**How it works**: 
- Users type message and send
- Message delivered instantly via WebSocket
- Both parties see message immediately
- Conversation history maintained
- Messages timestamped

**Example**: 
```
Seller: "Hi, I've started on your project"
Buyer: "Great! When will first milestone be ready?"
Seller: "About 3 days"
Buyer: "Perfect, looking forward to it"
```

---

### Component 2: File Attachments

**Purpose**: Share documents, images, and files  
**How it works**: 
- Users can attach files to messages
- Files uploaded to secure storage
- Recipient can download files
- File size limits apply
- Supported formats: PDF, images, documents

**Example**: 
```
Seller: "Here are the design mockups" [mockups.pdf]
Buyer: "Looks good, approved!" [approval.pdf]
```

---

### Component 3: Conversation History

**Purpose**: Maintain complete message history  
**How it works**: 
- All messages stored in database
- History accessible anytime
- Can scroll back to view old messages
- Searchable message history
- Permanent record of communications

**Example**: 
```
User can view:
- All messages from past 6 months
- Search for specific keywords
- Find files shared in conversation
```

---

### Component 4: Unread Message Tracking

**Purpose**: Know when new messages arrive  
**How it works**: 
- Unread messages counted per conversation
- Badge shows unread count
- Marked as read when opened
- Notifications for new messages
- Last message preview shown

**Example**: 
```
Contact List:
- Seller A: 3 unread messages
- Seller B: 0 unread messages
- Seller C: 1 unread message
```

---

## Feature Configuration

**Default Settings:**
- **Message Delivery**: Real-time via WebSocket
- **Unread Tracking**: Enabled
- **File Attachments**: Enabled
- **Max File Size**: 10 MB
- **Notification**: Enabled

**Customizable Settings:**
- **Notification Preferences**: On/off
- **Message Sound**: On/off
- **Desktop Notifications**: On/off

---

## Using This Feature

### As a Seller

**What you can do:**
- Send messages to clients
- Receive messages from clients
- Share files and documents
- View conversation history
- See unread message count

**Step-by-step:**
1. Open project
2. Click "Chat" tab
3. Type message
4. Click "Send"
5. Attach files if needed
6. View conversation history

---

### As a Buyer

**What you can do:**
- Send messages to seller
- Receive messages from seller
- Share files and documents
- View conversation history
- See unread message count

**Step-by-step:**
1. Open project
2. Click "Chat" tab
3. Type message
4. Click "Send"
5. Attach files if needed
6. View conversation history

---

## Common Questions

**Q: Is chat real-time?**  
A: Yes, messages are delivered instantly via WebSocket connection. You see messages as they're sent.

**Q: Can I share files?**  
A: Yes, you can attach files up to 10 MB. Supported formats include PDF, images, and documents.

**Q: Is chat history saved?**  
A: Yes, all messages are saved permanently. You can scroll back to view old conversations.

**Q: Will I get notifications?**  
A: Yes, you'll get notifications for new messages. You can customize notification settings.

**Q: Can I delete messages?**  
A: No, messages cannot be deleted. They're part of the permanent record.

**Q: Can I edit messages?**  
A: No, messages cannot be edited after sending.

**Q: Is chat encrypted?**  
A: Yes, messages are encrypted in transit using HTTPS/WSS.

**Q: Can I chat with multiple people?**  
A: Chat is per-project. Each project has its own conversation.

---

## What Can Go Wrong

### Error: Message Not Sending
**When it happens**: Message appears to send but doesn't arrive  
**Error message**: "Message failed to send"  
**What it means**: Network issue or server problem  
**How to fix**:
1. Check internet connection
2. Try sending again
3. Refresh page
4. Contact support if persists

**Prevention**: Ensure stable internet connection

---

### Error: File Too Large
**When it happens**: File exceeds size limit  
**Error message**: "File size exceeds 10 MB limit"  
**What it means**: File is too large to upload  
**How to fix**:
1. Compress file
2. Split into smaller files
3. Use file sharing service
4. Try different format

**Prevention**: Check file size before uploading

---

### Error: Unsupported File Type
**When it happens**: File format not supported  
**Error message**: "File type not supported"  
**What it means**: File format cannot be uploaded  
**How to fix**:
1. Convert to supported format
2. Try different file type
3. Use file sharing service

**Prevention**: Use common file formats (PDF, images, documents)

---

## Important Rules

### Rule 1: Chat Is Per-Project
**What it means**: Each project has separate conversation  
**Why it exists**: Keeps communications organized  
**Example**: 
- Project A has separate chat from Project B
- Can't mix conversations

**Exception**: None - chat is always per-project

---

### Rule 2: Messages Are Permanent
**What it means**: Messages cannot be deleted or edited  
**Why it exists**: Maintains communication record  
**Example**: 
- All messages saved permanently
- Can be referenced later

**Exception**: None - messages are permanent

---

### Rule 3: File Attachments Limited to 10 MB
**What it means**: Maximum file size is 10 MB  
**Why it exists**: Prevents server overload  
**Example**: 
- ✅ 5 MB PDF file
- ❌ 50 MB video file

**Exception**: None - 10 MB is hard limit

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not support video calls** - Chat only, no voice/video
- **Does not support group chat** - Only 1-on-1 per project
- **Does not support message reactions** - No emoji reactions
- **Does not support message search** - Can't search messages
- **Does not support message scheduling** - Messages sent immediately

**Alternative Solutions:**
- For **video calls**, use external video conferencing
- For **group chat**, use project management tool
- For **message search**, use browser find function

---

## Technical Details

**For Developers:**

**WebSocket Endpoint:**
- `wss://safebill.com/ws/chat/<project_id>/`

**Message Format:**
```json
{
  "type": "message",
  "content": "Hello, how are you?",
  "sender_id": 42,
  "timestamp": "2024-12-06T10:00:00Z",
  "attachment": null
}
```

**File Upload Endpoint:**
- `POST /api/chat/messages/` with file attachment

**Authentication Required**: Yes (JWT token)  
**Rate Limits**: 100 messages per minute

---

## Security Considerations

**Security Features:**
- HTTPS/WSS encryption for all communications
- JWT authentication required
- File virus scanning
- Message logging for disputes

**User Responsibilities:**
- Don't share sensitive information in chat
- Verify file sources before downloading
- Report suspicious messages

**Warnings:**
- ⚠️ Don't share payment information in chat
- ⚠️ Don't share personal information
- ⚠️ Verify file sources before opening

---

## Troubleshooting

### Problem: Messages Not Appearing
**Symptoms**: Send message but it doesn't show  
**Possible causes**:
1. Network connection lost
2. WebSocket disconnected
3. Browser issue
4. Server error

**Solutions**:
1. Check internet connection
2. Refresh page
3. Try different browser
4. Wait and try again

---

### Problem: Can't Upload File
**Symptoms**: File upload fails  
**Possible causes**:
1. File too large
2. Unsupported format
3. Network issue
4. Server error

**Solutions**:
1. Check file size (max 10 MB)
2. Try different format
3. Check internet connection
4. Try again later

---

## Glossary

**Message**: Text communication between users  
**Attachment**: File shared with message  
**Conversation**: All messages in a project  
**Unread**: Message not yet viewed by recipient  
**WebSocket**: Real-time communication protocol  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Feature_Project_Management

**Read this next:**
- Guide_How_To_Use_Chat

**Related topics:**
- Feature_Notifications

