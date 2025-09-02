import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const connectStripe = createAsyncThunk(
  'stripe/connectStripe',
  async ({ accessToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}api/connect-stripe/stripe-connect/`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Network error' });
    }
  }
);

export const checkStripeStatus = createAsyncThunk(
  'stripe/checkStripeStatus',
  async ({ accessToken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}api/connect-stripe/stripe-status/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Network error' });
    }
  }
);

export const createStripeIdentitySession = createAsyncThunk(
  'stripe/createStripeIdentitySession',
  async ({ accessToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}api/connect-stripe/stripe-identity/create/`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Network error' });
    }
  }
);

export const checkStripeIdentityStatus = createAsyncThunk(
  'stripe/checkStripeIdentityStatus',
  async ({ accessToken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}api/connect-stripe/stripe-identity/status/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ detail: 'Network error' });
    }
  }
);

const stripeSlice = createSlice({
  name: 'stripe',
  initialState: {
    loading: false,
    error: null,
    success: null,
    statusLoading: false,
    statusError: null,
    statusData: null,
    identityLoading: false,
    identityError: null,
    identitySuccess: null,
    identityStatusLoading: false,
    identityStatusError: null,
    identityStatusData: null,
  },
  reducers: {
    resetStripeState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = null;
      state.statusLoading = false;
      state.statusError = null;
      state.statusData = null;
      state.identityLoading = false;
      state.identityError = null;
      state.identitySuccess = null;
      state.identityStatusLoading = false;
      state.identityStatusError = null;
      state.identityStatusData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectStripe.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(connectStripe.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload;
        state.error = null;
      })
      .addCase(connectStripe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = null;
      })
      .addCase(checkStripeStatus.pending, (state) => {
        state.statusLoading = true;
        state.statusError = null;
        state.statusData = null;
      })
      .addCase(checkStripeStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.statusData = action.payload;
        state.statusError = null;
      })
      .addCase(checkStripeStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError = action.payload;
        state.statusData = null;
      })
      .addCase(createStripeIdentitySession.pending, (state) => {
        state.identityLoading = true;
        state.identityError = null;
        state.identitySuccess = null;
      })
      .addCase(createStripeIdentitySession.fulfilled, (state, action) => {
        state.identityLoading = false;
        state.identitySuccess = action.payload;
        state.identityError = null;
      })
      .addCase(createStripeIdentitySession.rejected, (state, action) => {
        state.identityLoading = false;
        state.identityError = action.payload;
        state.identitySuccess = null;
      })
      .addCase(checkStripeIdentityStatus.pending, (state) => {
        state.identityStatusLoading = true;
        state.identityStatusError = null;
        state.identityStatusData = null;
      })
      .addCase(checkStripeIdentityStatus.fulfilled, (state, action) => {
        state.identityStatusLoading = false;
        state.identityStatusData = action.payload;
        state.identityStatusError = null;
      })
      .addCase(checkStripeIdentityStatus.rejected, (state, action) => {
        state.identityStatusLoading = false;
        state.identityStatusError = action.payload;
        state.identityStatusData = null;
      });
  },
});

export const { resetStripeState } = stripeSlice.actions;
export default stripeSlice.reducer;