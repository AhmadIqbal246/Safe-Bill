import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export const registerSellerWithBasicAndBussiness = createAsyncThunk(
  'auth/registerSellerWithBasicAndBussiness',
  async (payload, { rejectWithValue }) => {
    try {
      // Replaced fetch with axios.post
      const response = await axios.post(
        `${BASE_URL}api/accounts/register/`,
        payload
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

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetAuthState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerSellerWithBasicAndBussiness.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerSellerWithBasicAndBussiness.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(registerSellerWithBasicAndBussiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;

