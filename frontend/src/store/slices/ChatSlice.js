import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import websocketService from '../../services/websocketService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => ({ Authorization: `Bearer ${sessionStorage.getItem('access')}` });

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${BASE_URL}api/projects/${projectId}/chat/messages/`,
        { headers: authHeader() }
      );
      return { projectId, messages: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const sendTextMessage = createAsyncThunk(
  'chat/sendTextMessage',
  async ({ projectId, messageData }, { rejectWithValue, dispatch }) => {
    try {
      // Send via WebSocket for real-time delivery
      const token = sessionStorage.getItem('access');
      websocketService.connect(projectId, token);
      
      // Send message through WebSocket
      websocketService.sendMessage(messageData.content, messageData.client_message_id);
      
      // Also send via API as backup
      const res = await axios.post(
        `${BASE_URL}api/projects/${projectId}/chat/messages/create/`,
        messageData,
        { headers: authHeader() }
      );
      
      return { projectId, message: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const connectToProjectChat = createAsyncThunk(
  'chat/connectToProjectChat',
  async ({ projectId }, { dispatch }) => {
    const token = sessionStorage.getItem('access');
    
    // Connect to WebSocket
    websocketService.connect(projectId, token);
    
    // Set up message handlers
    websocketService.on('newMessage', (message) => {
      dispatch(addIncomingMessage({ 
        projectId: message.project, 
        message: {
          id: message.id,
          client_message_id: message.client_message_id,
          sender: message.sender.id,
          content: message.content,
          attachment: message.attachment,
          created_at: message.created_at,
          read_at: message.read_at
        }
      }));
    });
    
    return { projectId };
  }
);

export const disconnectFromProjectChat = createAsyncThunk(
  'chat/disconnectFromProjectChat',
  async () => {
    websocketService.disconnect();
    return {};
  }
);

export const fetchChatContacts = createAsyncThunk(
  'chat/fetchChatContacts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${BASE_URL}api/chat/contacts/`,
        { headers: authHeader() }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markContactAsRead = createAsyncThunk(
  'chat/markContactAsRead',
  async (contactId, { rejectWithValue }) => {
    try {
      await axios.post(
        `${BASE_URL}api/chat/contacts/${contactId}/mark-read/`,
        {},
        { headers: authHeader() }
      );
      return contactId;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: {},
    messagesLoading: false,
    messagesError: null,
    chatContacts: [],
    chatContactsLoading: false,
    chatContactsError: null,
    selectedContact: null,
    isChatOpen: false,
    isContactListOpen: false,
  },
  reducers: {
    addIncomingMessage: (state, action) => {
      const { projectId, message } = action.payload;
      if (!state.messages[projectId]) {
        state.messages[projectId] = [];
      }
      state.messages[projectId].push(message);
      
      // Update unread count for the contact
      const contact = state.chatContacts.find(c => c.project_info.id === projectId);
      if (contact) {
        contact.unread_count += 1;
        contact.last_message_text = message.content;
        contact.last_message_at = message.created_at;
      }
    },
    clearChatErrors: (state) => {
      state.messagesError = null;
      state.chatContactsError = null;
    },
    setSelectedContact: (state, action) => {
      state.selectedContact = action.payload;
    },
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    toggleContactList: (state) => {
      state.isContactListOpen = !state.isContactListOpen;
    },
    closeChat: (state) => {
      state.isChatOpen = false;
      state.selectedContact = null;
    },
    closeContactList: (state) => {
      state.isContactListOpen = false;
    },
    updateContactUnreadCount: (state, action) => {
      const { contactId, unreadCount } = action.payload;
      const contact = state.chatContacts.find(c => c.id === contactId);
      if (contact) {
        contact.unread_count = unreadCount;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { projectId, messages } = action.payload;
        state.messagesLoading = false;
        state.messages[projectId] = messages.reverse(); // Reverse to show oldest first
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload || 'Failed to fetch messages';
      })
      // Send Message
      .addCase(sendTextMessage.fulfilled, (state, action) => {
        const { projectId, message } = action.payload;
        if (!state.messages[projectId]) {
          state.messages[projectId] = [];
        }
        state.messages[projectId].push(message);
      })
      // Fetch Chat Contacts
      .addCase(fetchChatContacts.pending, (state) => {
        state.chatContactsLoading = true;
        state.chatContactsError = null;
      })
      .addCase(fetchChatContacts.fulfilled, (state, action) => {
        state.chatContactsLoading = false;
        state.chatContacts = action.payload;
      })
      .addCase(fetchChatContacts.rejected, (state, action) => {
        state.chatContactsLoading = false;
        state.chatContactsError = action.payload || 'Failed to fetch chat contacts';
      })
      // Mark Contact as Read
      .addCase(markContactAsRead.fulfilled, (state, action) => {
        const contactId = action.payload;
        const contact = state.chatContacts.find(c => c.id === contactId);
        if (contact) {
          contact.unread_count = 0;
        }
      })
      // Connect to Project Chat
      .addCase(connectToProjectChat.fulfilled, (state, action) => {
        // WebSocket connection established
        console.log('Connected to project chat:', action.payload.projectId);
      })
      // Disconnect from Project Chat
      .addCase(disconnectFromProjectChat.fulfilled, (state) => {
        // WebSocket connection closed
        console.log('Disconnected from project chat');
      });
  },
});

export const { 
  addIncomingMessage, 
  clearChatErrors, 
  setSelectedContact, 
  toggleChat, 
  toggleContactList, 
  closeChat, 
  closeContactList,
  updateContactUnreadCount
} = chatSlice.actions;


export default chatSlice.reducer;