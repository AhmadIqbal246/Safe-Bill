import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import i18n from '../../i18n';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const submitFeedback = createAsyncThunk(
  'feedback/submitFeedback',
  async ({ email, feedback }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/feedback/submit/`,
        { email, feedback },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Network error' });
    }
  }
);

export const submitContactMessage = createAsyncThunk(
  'feedback/submitContactMessage',
  async ({ name, email, subject, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/feedback/contact/`,
        { name, email, subject, message },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Network error' });
    }
  }
);

export const submitCallbackRequest = createAsyncThunk(
  'feedback/submitCallbackRequest',
  async ({ company_name, siret_number, first_name, last_name, email, phone, role }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state?.auth?.access;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // Send user language to backend for localized email handling
      const lang = (i18n?.language || navigator?.language || 'fr');
      headers['X-User-Language'] = lang;

      const response = await axios.post(
        `${BASE_URL}api/feedback/callback-request/`,
        { company_name, siret_number, first_name, last_name, email, phone, role },
        { headers }
      );
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Network error' });
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetFeedbackState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitFeedback.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.detail || 'Failed to submit feedback.';
      })
      .addCase(submitContactMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitContactMessage.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(submitContactMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.detail || 'Failed to send message.';
      })
      .addCase(submitCallbackRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitCallbackRequest.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(submitCallbackRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.detail || 'Failed to submit callback request.';
      });
  },
});

export const { resetFeedbackState } = feedbackSlice.actions;
export default feedbackSlice.reducer;
