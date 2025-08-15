# Chat System - WhatsApp-like Chat List

This document describes the updated chat system that now includes a WhatsApp-like chat list functionality.

## Overview

The chat system has been enhanced to provide a chat list view where users can see all their chat contacts, similar to WhatsApp. This makes it easier for users to navigate between different conversations without having to go through projects.

## New Models

### ChatContact
- **Purpose**: Represents a chat contact between two users through a specific project
- **Fields**:
  - `user`: The user who owns this contact list
  - `contact`: The other user in the conversation
  - `project`: The project through which they're communicating
  - `last_message_at`: Timestamp of the last message
  - `last_message_text`: Preview of the last message
  - `unread_count`: Number of unread messages from this contact
  - `created_at`, `updated_at`: Timestamps

## New API Endpoints

### 1. Chat Contact List
- **URL**: `GET /api/chat/contacts/`
- **Purpose**: Get all chat contacts for the current user
- **Response**: List of chat contacts with contact info, project info, and message previews
- **Authentication**: Required

### 2. Chat Contact Detail
- **URL**: `GET /api/chat/contacts/{id}/`
- **Purpose**: Get detailed information about a specific chat contact
- **Response**: Detailed chat contact information
- **Authentication**: Required

### 3. Mark Contact as Read
- **URL**: `POST /api/chat/contacts/{contact_id}/mark-read/`
- **Purpose**: Mark all messages from a specific contact as read
- **Response**: Success status
- **Authentication**: Required

## Updated Endpoints

### Mark Read (Enhanced)
- **URL**: `POST /api/projects/{project_id}/chat/mark-read/`
- **Enhancement**: Now also updates the chat contact unread count
- **Purpose**: Mark messages as read and update contact list

## Features

### 1. Automatic Contact Creation
- Chat contacts are automatically created when messages are sent
- Each user gets a contact entry for every other user they communicate with
- Contacts are project-specific

### 2. Unread Message Tracking
- Unread count is automatically incremented when receiving messages
- Unread count is reset when marking messages as read
- Real-time updates through WebSocket connections

### 3. Message Preview
- Last message text is stored and displayed in the contact list
- Message preview is truncated to 50 characters for UI display

### 4. Project Context
- Each chat contact includes project information
- Users can see which project each conversation is related to

## Data Flow

1. **Message Sent**: When a user sends a message
   - Message is saved to the database
   - Conversation is updated with last message info
   - Chat contacts for both participants are updated
   - Unread count is incremented for the recipient

2. **Message Read**: When a user marks messages as read
   - Messages are marked as read in the database
   - Chat contact unread count is reset
   - Read receipts are sent via WebSocket

3. **Contact List**: When fetching chat contacts
   - All contacts for the current user are retrieved
   - Contacts are ordered by last message time
   - Unread counts and message previews are included

## Usage Examples

### Frontend Integration

```javascript
// Get all chat contacts
const response = await fetch('/api/chat/contacts/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const contacts = await response.json();

// Mark a contact as read
await fetch(`/api/chat/contacts/${contactId}/mark-read/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### WebSocket Integration

The existing WebSocket consumer has been updated to:
- Automatically update chat contacts when messages are sent
- Handle read receipts and update unread counts
- Maintain real-time synchronization

## Migration

For existing installations, run the management command to populate chat contacts:

```bash
python manage.py populate_chat_contacts
```

This will create chat contacts for all existing conversations.

## Benefits

1. **Better UX**: Users can see all their conversations in one place
2. **Faster Navigation**: No need to go through projects to find conversations
3. **Unread Tracking**: Clear indication of which conversations have new messages
4. **Message Previews**: Quick overview of recent conversations
5. **Project Context**: Users know which project each conversation relates to

## Future Enhancements

1. **Contact Search**: Search through chat contacts
2. **Contact Blocking**: Block specific users
3. **Contact Groups**: Group related contacts
4. **Message Status**: More detailed message delivery status
5. **File Sharing**: Enhanced file sharing capabilities
