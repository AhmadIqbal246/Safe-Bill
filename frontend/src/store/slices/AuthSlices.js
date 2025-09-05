import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { fetchUserProfile } from './UserProfileSlice';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Initialize from sessionStorage
const access = sessionStorage.getItem('access');
const refresh = sessionStorage.getItem('refresh');
const user = sessionStorage.getItem('user');

const initialState = {
  loading: false,
  error: null,
  success: false,
  user: user ? JSON.parse(user) : null,
  access: access || null,
  refresh: refresh || null,
  siretVerification: {
    loading: false,
    error: null,
    result: null,
  },
};

export const registerSellerWithBasicAndBussiness = createAsyncThunk(
  'auth/registerSellerWithBasicAndBussiness',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/accounts/seller-register/`,
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

// Login thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/accounts/login/`,
        { email, password }
      );
      // Decode user info from access token
      const decodedUser = jwtDecode(response.data.access);
      // Save tokens immediately for subsequent authorized calls
      sessionStorage.setItem('access', response.data.access);
      sessionStorage.setItem('refresh', response.data.refresh);

      // Fetch profile once to get fields like profile_pic
      let mergedUser = decodedUser;
      try {
        const profileResp = await axios.get(`${BASE_URL}api/accounts/profile/`, {
          headers: { 'Authorization': `Bearer ${response.data.access}` },
        });
        mergedUser = { ...decodedUser, ...profileResp.data };
      } catch (e) {
        // If profile fetch fails, proceed with decoded token payload only
        mergedUser = decodedUser;
      }

      // Persist final user payload
      sessionStorage.setItem('user', JSON.stringify(mergedUser));
      return { ...response.data, user: mergedUser };
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Network error' });
    }
  }
);

export const verifySiret = createAsyncThunk(
  'auth/verifySiret',
  async (siret, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/accounts/verify-siret/`,
        { siret }
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

export const registerBuyer = createAsyncThunk(
  'auth/registerBuyer',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/accounts/buyer-register/`,
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
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    logout: (state) => {
      state.user = null;
      state.access = null;
      state.refresh = null;
      state.success = false;
      state.error = null;
      state.loading = false;
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
      sessionStorage.removeItem('user');
    },
    setUser: (state, action) => {
      state.user = action.payload;
      sessionStorage.setItem('user', JSON.stringify(action.payload));
    },
    resetSiretVerification: (state) => {
      state.siretVerification = { loading: false, error: null, result: null };
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
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user;
        state.access = action.payload.access;
        state.refresh = action.payload.refresh;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        const mergedUser = {
          ...(state.user || {}),
          ...action.payload,
        };
        state.user = mergedUser;
        sessionStorage.setItem('user', JSON.stringify(mergedUser));
      })
      .addCase(fetchUserProfile.rejected, (state) => {
      })
      .addCase(registerBuyer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerBuyer.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(registerBuyer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(verifySiret.pending, (state) => {
        state.siretVerification.loading = true;
        state.siretVerification.error = null;
        state.siretVerification.result = null;
      })
      .addCase(verifySiret.fulfilled, (state, action) => {
        state.siretVerification.loading = false;
        state.siretVerification.result = action.payload;
      })
      .addCase(verifySiret.rejected, (state, action) => {
        state.siretVerification.loading = false;
        state.siretVerification.error = action.payload?.detail || 'Failed to verify SIRET.';
      });
  },
});

export const { resetAuthState, logout, setUser, resetSiretVerification } = authSlice.actions;
export default authSlice.reducer;

