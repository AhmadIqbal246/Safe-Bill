# Chat System Components

This directory contains the chat system components that provide a WhatsApp-like chat experience for both buyers and sellers.

## Components

### 1. ChatButton
- **Purpose**: Floating action button (FAB) that opens the chat contact list
- **Features**: 
  - Shows unread message count as a red badge
  - Positioned in bottom-right corner
  - Blue circular button with message icon
  - Hover effects and animations

### 2. ChatContactList
- **Purpose**: Modal that displays all chat contacts
- **Features**:
  - Search functionality for contacts
  - Shows contact name, project name, and last message preview
  - Displays unread message count for each contact
  - Shows last message time
  - Click to open conversation

### 3. ChatWindow
- **Purpose**: Main chat interface for conversations
- **Features**:
  - Real-time message display
  - Message input with send button
  - File attachment support (UI ready, backend integration needed)
  - Contact information in header
  - Responsive design

### 4. Chat (Main Component)
- **Purpose**: Combines all chat components
- **Usage**: Simply import and use `<Chat />` in any page

## Usage

### Basic Implementation
```jsx
import Chat from '../components/mutualComponents/Chat/Chat';

function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <Chat />
    </div>
  );
}
```

### Already Integrated In
- **BuyerDashboardPage**: Chat available for buyers
- **SellerDashboardPage**: Chat available for sellers

## Features

### ✅ Implemented
- Floating chat button with unread count
- Contact list with search
- Real-time messaging interface
- Unread message indicators
- Project context for each conversation
- Responsive design
- Redux state management

### 🔄 Partially Implemented
- File attachments (UI ready, backend integration needed)
- WebSocket real-time updates (backend ready, frontend integration needed)

### 📋 Future Enhancements
- Typing indicators
- Message status (sent, delivered, read)
- Contact blocking
- Group chats
- Message reactions
- Voice messages

## State Management

The chat system uses Redux with the following state structure:

```javascript
chat: {
  messages: {},           // Messages by project ID
  chatContacts: [],       // List of chat contacts
  selectedContact: null,  // Currently selected contact
  isChatOpen: false,      // Chat window open state
  isContactListOpen: false, // Contact list open state
  // ... loading and error states
}
```

## API Integration

The system integrates with the backend chat API:
- `GET /api/chat/contacts/` - Fetch chat contacts
- `GET /api/projects/{id}/chat/messages/` - Fetch messages
- `POST /api/projects/{id}/chat/messages/create/` - Send message
- `POST /api/chat/contacts/{id}/mark-read/` - Mark as read

## Styling

Uses Tailwind CSS with the SafeBill color scheme:
- Primary: `#01257D` (dark blue)
- Secondary: `#2346a0` (lighter blue)
- Accent: `#E6F0FA` (light blue background)
- Success: `#10B981` (green for unread indicators)

## Responsive Design

- Mobile-first approach
- Floating button adapts to screen size
- Modals are responsive and mobile-friendly
- Touch-friendly interactions

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast indicators
- Focus management
