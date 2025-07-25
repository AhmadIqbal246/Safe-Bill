import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {},
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
      });
  },
});

export default notificationSlice.reducer; 