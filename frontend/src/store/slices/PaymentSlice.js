import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch user's payment history (billings)
export const fetchBillings = createAsyncThunk(
  'payment/fetchBillings',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/payments/billings/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
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

// Fetch user's balance summary
export const fetchBalance = createAsyncThunk(
  'payment/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/payments/balance/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
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

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    // Billings data
    billings: [],
    billingsLoading: false,
    billingsError: null,
    
    // Balance data
    balance: null,
    balanceLoading: false,
    balanceError: null,
  },
  reducers: {
    clearPaymentState: (state) => {
      state.billingsError = null;
      state.balanceError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Billings
      .addCase(fetchBillings.pending, (state) => {
        state.billingsLoading = true;
        state.billingsError = null;
      })
      .addCase(fetchBillings.fulfilled, (state, action) => {
        state.billingsLoading = false;
        state.billings = action.payload.results || [];
      })
      .addCase(fetchBillings.rejected, (state, action) => {
        state.billingsLoading = false;
        state.billingsError = action.payload || 'Failed to fetch billings';
      })
      
      // Fetch Balance
      .addCase(fetchBalance.pending, (state) => {
        state.balanceLoading = true;
        state.balanceError = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.balanceError = action.payload || 'Failed to fetch balance';
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
