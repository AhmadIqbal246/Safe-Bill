# WebSocket Real-Time Chat Setup

## Overview

The chat system now includes real-time messaging using WebSockets. Messages appear immediately without needing to refresh or wait for API calls.

## How It Works

1. **When chat opens**: WebSocket connection is established to the project's chat room
2. **When sending messages**: Message is sent via WebSocket for immediate delivery
3. **When receiving messages**: Messages appear instantly via WebSocket events
4. **When chat closes**: WebSocket connection is automatically closed

## Backend Requirements

Make sure your Django backend has:

1. **Django Channels** installed and configured
2. **WebSocket routing** set up in `chat/routing.py`
3. **ASGI server** running (e.g., Daphne or uvicorn)

## Frontend Configuration

The WebSocket service automatically uses:
- **Default URL**: `ws://127.0.0.1:8000/ws/chat/project/{projectId}/?token={accessToken}`
- **Custom URL**: Set `VITE_WS_BASE_URL` in your `.env` file

## Environment Variables

Create a `.env` file in your frontend directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000/

# WebSocket Configuration (for real-time chat)
VITE_WS_BASE_URL=ws://127.0.0.1:8000
```

## Testing Real-Time Chat

1. **Open two browser windows** (or use incognito mode)
2. **Log in as different users** in each window
3. **Open the same project chat** in both windows
4. **Send messages** - they should appear immediately in both windows

## Troubleshooting

### Messages not appearing in real-time?

1. **Check browser console** for WebSocket connection errors
2. **Verify Django server** is running with Channels support
3. **Check WebSocket routing** in `chat/routing.py`
4. **Ensure ASGI server** is running (not just Django dev server)

### WebSocket connection failed?

1. **Check CORS settings** in Django
2. **Verify token authentication** is working
3. **Check WebSocket URL** format
4. **Ensure project exists** and user has access

## Features

- ✅ **Real-time messaging** - Messages appear instantly
- ✅ **Automatic reconnection** - Handles connection drops
- ✅ **Typing indicators** - Shows when someone is typing (ready for implementation)
- ✅ **Read receipts** - Shows when messages are read (ready for implementation)
- ✅ **File attachments** - Ready for implementation
- ✅ **Multiple projects** - Each project has its own WebSocket room

## Performance

- **Efficient**: Only connects to WebSocket when chat is open
- **Automatic cleanup**: Disconnects when chat closes
- **Reconnection logic**: Handles network issues gracefully
- **Memory management**: Cleans up event handlers properly
