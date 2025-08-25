import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchUserProfile = createAsyncThunk(
  'userProfile/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/accounts/profile/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'userProfile/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      let dataToSend;
      let headers;
      
      if (profileData.profile_pic) {
        // If updating profile_pic, use FormData
        dataToSend = new FormData();
        
        Object.entries(profileData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'profile_pic') {
              // Handle file directly
              dataToSend.append(key, value);
            } else if (Array.isArray(value)) {
              // For Django backend, send arrays as JSON strings
              // This ensures proper handling of selected_categories, selected_subcategories, etc.
              dataToSend.append(key, JSON.stringify(value));
            } else {
              dataToSend.append(key, value);
            }
          }
        });
        
        headers = {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser handle it
        };
      } else {
        dataToSend = profileData;
        headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
      }
      
      const response = await axios.patch(
        `${BASE_URL}api/accounts/profile/`,
        dataToSend,
        { headers }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);


const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState: {
    loading: false,
    error: null,
    success: false,
    profile: null,
  },
  reducers: {
    resetUserProfileState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.success = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch profile';
        state.success = false;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.success = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
        state.success = false;
      });
  },
});

export const { resetUserProfileState } = userProfileSlice.actions;
export default userProfileSlice.reducer;
