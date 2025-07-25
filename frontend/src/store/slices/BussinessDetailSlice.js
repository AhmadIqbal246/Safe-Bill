import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const uploadBusinessDocuments = createAsyncThunk(
  'business/uploadBusinessDocuments',
  async ({ formData, accessToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/business-documents/upload-multiple/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
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

export const fetchUserDocuments = createAsyncThunk(
  'business/fetchUserDocuments',
  async (accessToken, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/business-documents/my-documents/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
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

const businessDetailSlice = createSlice({
  name: 'businessDetail',
  initialState: {
    loading: false,
    error: null,
    success: false,
    uploadedDocs: null,
    userDocuments: null,
  },
  reducers: {
    resetBusinessDetailState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.uploadedDocs = null;
      state.userDocuments = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadBusinessDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(uploadBusinessDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.uploadedDocs = action.payload;
      })
      .addCase(uploadBusinessDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(fetchUserDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.userDocuments = action.payload;
      })
      .addCase(fetchUserDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetBusinessDetailState } = businessDetailSlice.actions;
export default businessDetailSlice.reducer;
