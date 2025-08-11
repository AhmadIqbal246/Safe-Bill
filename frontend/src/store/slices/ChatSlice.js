import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/';

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
  async ({ projectId, messageData }, { rejectWithValue }) => {
    try {
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

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: {},
    messagesLoading: false,
    messagesError: null,
  },
  reducers: {
    addIncomingMessage: (state, action) => {
      const { projectId, message } = action.payload;
      if (!state.messages[projectId]) {
        state.messages[projectId] = [];
      }
      state.messages[projectId].push(message);
    },
    clearChatErrors: (state) => {
      state.messagesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(sendTextMessage.fulfilled, (state, action) => {
        const { projectId, message } = action.payload;
        if (!state.messages[projectId]) {
          state.messages[projectId] = [];
        }
        state.messages[projectId].push(message);
      });
  },
});

export const { addIncomingMessage, clearChatErrors } = chatSlice.actions;
export default chatSlice.reducer;