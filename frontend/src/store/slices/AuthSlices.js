import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { fetchUserProfile } from './UserProfileSlice';
import i18n from '../../i18n';

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
    lastSiret: null,
  },
  accountDeletion: {
    eligibility: null,
    loading: false,
    error: null,
    deletionLoading: false,
    deletionError: null,
    deletionSuccess: false,
  },
};

export const registerSellerWithBasicAndBussiness = createAsyncThunk(
  'auth/registerSellerWithBasicAndBussiness',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/accounts/seller-register/`,
        payload,
        {
          headers: {
            'X-User-Language': (i18n.language || 'en'),
            'Accept-Language': (i18n.language || 'en'),
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

// Login thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  // Added: optional desiredRole to log in as a specific role (seller | professional-buyer)
  async ({ email, password, desiredRole }, { rejectWithValue }) => {
    try {
      const payload = { email, password };
      if (desiredRole) payload.desired_role = desiredRole; // Added: send desired role to backend
      const response = await axios.post(
        `${BASE_URL}api/accounts/login/`,
        payload
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

// Logout thunk
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const refresh = state.auth.refresh;
      
      if (refresh) {
        await axios.post(
          `${BASE_URL}api/accounts/logout/`,
          { refresh },
          {
            headers: {
              'Authorization': `Bearer ${state.auth.access}`,
            },
          }
        );
      }
      
      // Clear session storage
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
      sessionStorage.removeItem('user');
      
      return { success: true };
    } catch (err) {
      // Even if API call fails, clear local storage
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
      sessionStorage.removeItem('user');
      
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Logout failed but local data cleared' });
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
        payload,
        {
          headers: {
            'X-User-Language': (i18n.language || 'en'),
            'Accept-Language': (i18n.language || 'en'),
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

// Removed in-app role switcher: switching roles occurs only via login with desired_role

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
      // In-app role switching disabled by requirement
      .addCase(verifySiret.pending, (state) => {
        state.siretVerification.loading = true;
        state.siretVerification.error = null;
        state.siretVerification.result = null;
      })
      .addCase(verifySiret.fulfilled, (state, action) => {
        state.siretVerification.loading = false;
        state.siretVerification.result = action.payload;
        if (action.payload?.valid && action.meta?.arg) {
          state.siretVerification.lastSiret = action.meta.arg;
        }
      })
      .addCase(verifySiret.rejected, (state, action) => {
        state.siretVerification.loading = false;
        state.siretVerification.error = action.payload?.detail || 'Failed to verify SIRET.';
      })
      // Role switching cases
      .addCase(switchActiveRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(switchActiveRole.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
        // Force update sessionStorage with the complete user data
        sessionStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(switchActiveRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to switch role';
      })
      // Account deletion reducers
      .addCase(checkDeletionEligibility.pending, (state) => {
        state.accountDeletion.loading = true;
        state.accountDeletion.error = null;
      })
      .addCase(checkDeletionEligibility.fulfilled, (state, action) => {
        state.accountDeletion.loading = false;
        state.accountDeletion.eligibility = action.payload;
        state.accountDeletion.error = null;
      })
      .addCase(checkDeletionEligibility.rejected, (state, action) => {
        state.accountDeletion.loading = false;
        state.accountDeletion.error = action.payload;
      })
      .addCase(deleteUserAccount.pending, (state) => {
        state.accountDeletion.deletionLoading = true;
        state.accountDeletion.deletionError = null;
        state.accountDeletion.deletionSuccess = false;
      })
      .addCase(deleteUserAccount.fulfilled, (state, action) => {
        state.accountDeletion.deletionLoading = false;
        state.accountDeletion.deletionSuccess = true;
        state.accountDeletion.deletionError = null;
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.accountDeletion.deletionLoading = false;
        state.accountDeletion.deletionError = action.payload;
        state.accountDeletion.deletionSuccess = false;
      });
  },
});

// Role switching thunk
export const switchActiveRole = createAsyncThunk(
  'auth/switchActiveRole',
  async ({ targetRole }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}api/accounts/role/switch/`, {
        target_role: targetRole
      }, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access')}` }
      });
      
      if (response.data) {
        // Fetch updated profile to get latest onboarding status
        const profileResponse = await axios.get(`${BASE_URL}api/accounts/profile/`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access')}` }
        });
        
        const updatedUser = {
          ...profileResponse.data,
          role: response.data.role,
          active_role: response.data.active_role,
          available_roles: response.data.available_roles
        };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        
        return {
          user: updatedUser,
          role: response.data.role,
          active_role: response.data.active_role,
          available_roles: response.data.available_roles
        };
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to switch role');
    }
  }
);

// Account deletion thunks
export const checkDeletionEligibility = createAsyncThunk(
  'auth/checkDeletionEligibility',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const response = await axios.get(
        `${BASE_URL}api/accounts/deletion-eligibility/`,
        {
          headers: {
            'Authorization': `Bearer ${state.auth.access}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Failed to check deletion eligibility' });
    }
  }
);

export const deleteUserAccount = createAsyncThunk(
  'auth/deleteUserAccount',
  async (formData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const response = await axios.post(
        `${BASE_URL}api/accounts/delete-account/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${state.auth.access}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Failed to delete account' });
    }
  }
);

export const { resetAuthState, logout, setUser, resetSiretVerification } = authSlice.actions;
export default authSlice.reducer;

