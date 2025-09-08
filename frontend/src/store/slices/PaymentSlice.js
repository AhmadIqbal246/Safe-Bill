import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch platform fee configuration (buyer and seller percentages)
export const fetchPlatformFees = createAsyncThunk(
  'payment/fetchPlatformFees',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/payments/fees/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      return response.data; // { buyer_fee_pct, seller_fee_pct }
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

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

// Fetch seller payout holds
export const fetchPayoutHolds = createAsyncThunk(
  'payment/fetchPayoutHolds',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/payments/payout-holds/`,
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

// Fetch seller transfer history (payouts)
export const fetchTransfers = createAsyncThunk(
  'payment/fetchTransfers',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/payments/transfers/`,
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

// Fetch revenue comparison data
export const fetchRevenueComparison = createAsyncThunk(
  'payment/fetchRevenueComparison',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/payments/revenue-comparison/`,
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
    // Platform fees
    platformFees: null, // { buyer_fee_pct, seller_fee_pct }
    platformFeesLoading: false,
    platformFeesError: null,

    // Billings data
    billings: [],
    billingsLoading: false,
    billingsError: null,
    
    // Balance data
    balance: null,
    balanceLoading: false,
    balanceError: null,

    // Payout holds (seller)
    payoutHolds: [],
    payoutHoldsLoading: false,
    payoutHoldsError: null,

    // Transfers (payouts) (seller)
    transfers: [],
    transfersLoading: false,
    transfersError: null,

    // Revenue comparison (seller)
    revenueComparison: null,
    revenueComparisonLoading: false,
    revenueComparisonError: null,
  },
  reducers: {
    clearPaymentState: (state) => {
      state.billingsError = null;
      state.balanceError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Platform Fees
      .addCase(fetchPlatformFees.pending, (state) => {
        state.platformFeesLoading = true;
        state.platformFeesError = null;
      })
      .addCase(fetchPlatformFees.fulfilled, (state, action) => {
        state.platformFeesLoading = false;
        state.platformFees = action.payload;
      })
      .addCase(fetchPlatformFees.rejected, (state, action) => {
        state.platformFeesLoading = false;
        state.platformFeesError = action.payload || 'Failed to fetch platform fees';
      })
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
      })
      // Fetch Payout Holds
      .addCase(fetchPayoutHolds.pending, (state) => {
        state.payoutHoldsLoading = true;
        state.payoutHoldsError = null;
      })
      .addCase(fetchPayoutHolds.fulfilled, (state, action) => {
        state.payoutHoldsLoading = false;
        state.payoutHolds = action.payload.results || [];
      })
      .addCase(fetchPayoutHolds.rejected, (state, action) => {
        state.payoutHoldsLoading = false;
        state.payoutHoldsError = action.payload || 'Failed to fetch payout holds';
      })
      // Fetch Transfers
      .addCase(fetchTransfers.pending, (state) => {
        state.transfersLoading = true;
        state.transfersError = null;
      })
      .addCase(fetchTransfers.fulfilled, (state, action) => {
        state.transfersLoading = false;
        state.transfers = action.payload.results || [];
      })
      .addCase(fetchTransfers.rejected, (state, action) => {
        state.transfersLoading = false;
        state.transfersError = action.payload || 'Failed to fetch transfers';
      })
      // Fetch Revenue Comparison
      .addCase(fetchRevenueComparison.pending, (state) => {
        state.revenueComparisonLoading = true;
        state.revenueComparisonError = null;
      })
      .addCase(fetchRevenueComparison.fulfilled, (state, action) => {
        state.revenueComparisonLoading = false;
        state.revenueComparison = action.payload;
      })
      .addCase(fetchRevenueComparison.rejected, (state, action) => {
        state.revenueComparisonLoading = false;
        state.revenueComparisonError = action.payload || 'Failed to fetch revenue comparison';
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
