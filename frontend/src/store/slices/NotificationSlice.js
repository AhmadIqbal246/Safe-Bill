import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationWebSocketService from '../../services/notificationWebSocketService.js';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}api/notifications/`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('access')}`,
          },
          credentials: 'include',
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to fetch notifications');
      }
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}api/notifications/${id}/read/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('access')}`,
          },
          credentials: 'include',
          body: JSON.stringify({ is_read: true }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to mark as read');
      }
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsRead = createAsyncThunk(
    'notifications/markAllRead',
    async (_, { rejectWithValue }) => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}api/notifications/mark-all-read/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionStorage.getItem('access')}`,
            },
            credentials: 'include',
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Failed to mark all as read');
        }
        return await res.json();
      } catch (err) {
        return rejectWithValue(err.message);
      }
    }
  );

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    loading: false,
    error: null,
    markAllLoading: false,
    markAllError: null,
    websocketConnected: false,
  },
  reducers: {
    // WebSocket actions
    connectWebSocket: (state, action) => {
      const token = action.payload;
      notificationWebSocketService.connect(token);
      state.websocketConnected = true;
    },
    disconnectWebSocket: (state) => {
      notificationWebSocketService.disconnect();
      state.websocketConnected = false;
    },
    addNotification: (state, action) => {
      const notification = action.payload;
      const existingIndex = state.notifications.findIndex(n => n.id === notification.id);
      if (existingIndex === -1) {
        // Add notification to the beginning of the list
        state.notifications.unshift(notification);
      } else {
        // Update existing notification in place to avoid duplicates
        state.notifications[existingIndex] = { ...state.notifications[existingIndex], ...notification };
      }
    },
    addNotifications: (state, action) => {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      for (const notification of incoming) {
        const existingIndex = state.notifications.findIndex(n => n.id === notification.id);
        if (existingIndex === -1) {
          state.notifications.push(notification);
        } else {
          state.notifications[existingIndex] = { ...state.notifications[existingIndex], ...notification };
        }
      }
    },
    updateNotification: (state, action) => {
      const updatedNotification = action.payload;
      const index = state.notifications.findIndex(n => n.id === updatedNotification.id);
      if (index !== -1) {
        state.notifications[index] = updatedNotification;
      }
    },
    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.is_read = true;
      }
    },
    markAllAsRead: (state) => {
      state.notifications = state.notifications.map(n => ({ ...n, is_read: true }));
    },
    setWebSocketConnectionStatus: (state, action) => {
      state.websocketConnected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        // Update the notification in state as read
        const idx = state.notifications.findIndex(n => n.id === action.payload.id);
        if (idx !== -1) {
          state.notifications[idx] = action.payload;
        }
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.markAllLoading = true;
        state.markAllError = null;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.markAllLoading = false;
        // Mark all notifications as read in state
        state.notifications = state.notifications.map(n => ({ ...n, is_read: true }));
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.markAllLoading = false;
        state.markAllError = action.payload;
      });
  },
});

// Export actions
export const {
  connectWebSocket,
  disconnectWebSocket,
  addNotification,
  addNotifications,
  updateNotification,
  markNotificationAsRead,
  markAllAsRead,
  setWebSocketConnectionStatus,
} = notificationSlice.actions;

export default notificationSlice.reducer; 