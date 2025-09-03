import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Token ${token}` } : {};
};

// Async thunks for API calls
export const fetchTransferInfo = createAsyncThunk(
  'fundsTransfer/fetchTransferInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/payments/transfer-info/`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch transfer information'
      );
    }
  }
);

export const createTransfer = createAsyncThunk(
  'fundsTransfer/createTransfer',
  async ({ amount, currency = 'EUR' }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/payments/transfer-to-stripe/`,
        { amount, currency },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to create transfer'
      );
    }
  }
);

export const fetchTransferHistory = createAsyncThunk(
  'fundsTransfer/fetchTransferHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/payments/transfers/`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch transfer history'
      );
    }
  }
);

export const generateStripeLoginLink = createAsyncThunk(
  'fundsTransfer/generateStripeLoginLink',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}api/payments/stripe-login-link/`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to generate Stripe login link'
      );
    }
  }
);

// Initial state
const initialState = {
  // Transfer info
  transferInfo: null,
  transferInfoLoading: false,
  transferInfoError: null,
  
  // Create transfer
  transferLoading: false,
  transferError: null,
  lastTransfer: null,
  
  // Transfer history
  transfers: [],
  transfersLoading: false,
  transfersError: null,
  transfersCount: 0,
  
  // Stripe login link
  stripeLoginLink: null,
  stripeLoginLinkLoading: false,
  stripeLoginLinkError: null,
  
  // UI state
  isInitialized: false,
};

// Slice
const fundsTransferSlice = createSlice({
  name: 'fundsTransfer',
  initialState,
  reducers: {
    // Clear errors
    clearTransferInfoError: (state) => {
      state.transferInfoError = null;
    },
    clearTransferError: (state) => {
      state.transferError = null;
    },
    clearTransfersError: (state) => {
      state.transfersError = null;
    },
    clearStripeLoginLinkError: (state) => {
      state.stripeLoginLinkError = null;
    },
    
    // Reset state
    resetTransferState: () => {
      return initialState;
    },
    
    // Update transfer status (for real-time updates from websockets)
    updateTransferStatus: (state, action) => {
      const { transferId, status, completedAt, failureReason } = action.payload;
      const transferIndex = state.transfers.findIndex(
        transfer => transfer.stripe_transfer_id === transferId
      );
      
      if (transferIndex !== -1) {
        state.transfers[transferIndex].status = status;
        if (completedAt) {
          state.transfers[transferIndex].completed_at = completedAt;
        }
        if (failureReason) {
          state.transfers[transferIndex].failure_reason = failureReason;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch transfer info
    builder
      .addCase(fetchTransferInfo.pending, (state) => {
        state.transferInfoLoading = true;
        state.transferInfoError = null;
      })
      .addCase(fetchTransferInfo.fulfilled, (state, action) => {
        state.transferInfoLoading = false;
        state.transferInfo = action.payload;
        state.isInitialized = true;
      })
      .addCase(fetchTransferInfo.rejected, (state, action) => {
        state.transferInfoLoading = false;
        state.transferInfoError = action.payload;
      });

    // Create transfer
    builder
      .addCase(createTransfer.pending, (state) => {
        state.transferLoading = true;
        state.transferError = null;
      })
      .addCase(createTransfer.fulfilled, (state, action) => {
        state.transferLoading = false;
        state.lastTransfer = action.payload;
        
        // Add the new transfer to the history if we have the data
        if (action.payload.payout_id) {
          const newTransfer = {
            id: action.payload.payout_id,
            stripe_transfer_id: action.payload.transfer_id,
            amount: action.payload.amount,
            currency: action.payload.currency,
            status: 'in_transit',
            created_at: new Date().toISOString(),
            stripe_account_id: action.payload.destination,
          };
          state.transfers.unshift(newTransfer);
          state.transfersCount += 1;
        }
      })
      .addCase(createTransfer.rejected, (state, action) => {
        state.transferLoading = false;
        state.transferError = action.payload;
      });

    // Fetch transfer history
    builder
      .addCase(fetchTransferHistory.pending, (state) => {
        state.transfersLoading = true;
        state.transfersError = null;
      })
      .addCase(fetchTransferHistory.fulfilled, (state, action) => {
        state.transfersLoading = false;
        state.transfers = action.payload.results || [];
        state.transfersCount = action.payload.count || 0;
      })
      .addCase(fetchTransferHistory.rejected, (state, action) => {
        state.transfersLoading = false;
        state.transfersError = action.payload;
      });

    // Generate Stripe login link
    builder
      .addCase(generateStripeLoginLink.pending, (state) => {
        state.stripeLoginLinkLoading = true;
        state.stripeLoginLinkError = null;
      })
      .addCase(generateStripeLoginLink.fulfilled, (state, action) => {
        state.stripeLoginLinkLoading = false;
        state.stripeLoginLink = action.payload;
      })
      .addCase(generateStripeLoginLink.rejected, (state, action) => {
        state.stripeLoginLinkLoading = false;
        state.stripeLoginLinkError = action.payload;
      });
  },
});

// Export actions
export const {
  clearTransferInfoError,
  clearTransferError,
  clearTransfersError,
  clearStripeLoginLinkError,
  resetTransferState,
  updateTransferStatus,
} = fundsTransferSlice.actions;

// Selectors
export const selectTransferInfo = (state) => state.fundsTransfer.transferInfo;
export const selectTransferInfoLoading = (state) => state.fundsTransfer.transferInfoLoading;
export const selectTransferInfoError = (state) => state.fundsTransfer.transferInfoError;

export const selectTransferLoading = (state) => state.fundsTransfer.transferLoading;
export const selectTransferError = (state) => state.fundsTransfer.transferError;
export const selectLastTransfer = (state) => state.fundsTransfer.lastTransfer;

export const selectTransfers = (state) => state.fundsTransfer.transfers;
export const selectTransfersLoading = (state) => state.fundsTransfer.transfersLoading;
export const selectTransfersError = (state) => state.fundsTransfer.transfersError;
export const selectTransfersCount = (state) => state.fundsTransfer.transfersCount;

export const selectStripeLoginLink = (state) => state.fundsTransfer.stripeLoginLink;
export const selectStripeLoginLinkLoading = (state) => state.fundsTransfer.stripeLoginLinkLoading;
export const selectStripeLoginLinkError = (state) => state.fundsTransfer.stripeLoginLinkError;

export const selectIsInitialized = (state) => state.fundsTransfer.isInitialized;

// Combined selectors
export const selectCanTransfer = (state) => {
  const transferInfo = state.fundsTransfer.transferInfo;
  return transferInfo?.can_transfer || false;
};

export const selectHasStripeAccount = (state) => {
  const transferInfo = state.fundsTransfer.transferInfo;
  return transferInfo?.has_stripe_account || false;
};

export default fundsTransferSlice.reducer;
