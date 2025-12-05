import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchSubscriptionStatus = createAsyncThunk(
  "subscription/fetchSubscriptionStatus",
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem("access");
      const res = await axios.get(`${BASE_URL}api/subscription/status/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const createSubscriptionSession = createAsyncThunk(
  "subscription/createSubscriptionSession",
  async ({ successUrl, cancelUrl }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem("access");
      const res = await axios.post(
        `${BASE_URL}api/subscription/subscribe/`,
        {
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      return res.data; // { checkout_url }
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const fetchSubscriptionEligibility = createAsyncThunk(
  "subscription/fetchSubscriptionEligibility",
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem("access");
      const res = await axios.get(`${BASE_URL}api/subscription/eligibility/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return res.data; // { needs_subscription, membership_active, status, current_period_end }
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const fetchSubscriptionInvoices = createAsyncThunk(
  "subscription/fetchSubscriptionInvoices",
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem("access");
      const res = await axios.get(`${BASE_URL}api/subscription/invoices/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return res.data; // { invoices, count }
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    statusData: null,
    statusLoading: false,
    statusError: null,

    checkout: null,
    checkoutLoading: false,
    checkoutError: null,

    eligibility: null,
    eligibilityLoading: false,
    eligibilityError: null,

    invoices: [],
    invoicesLoading: false,
    invoicesError: null,
  },
  reducers: {
    clearSubscriptionState: (state) => {
      state.statusError = null;
      state.checkoutError = null;
      state.eligibilityError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.statusLoading = true;
        state.statusError = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.statusData = action.payload;
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError = action.payload || "Failed to fetch subscription status";
      })
      .addCase(createSubscriptionSession.pending, (state) => {
        state.checkoutLoading = true;
        state.checkoutError = null;
      })
      .addCase(createSubscriptionSession.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.checkout = action.payload;
      })
      .addCase(createSubscriptionSession.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError = action.payload || "Failed to start subscription";
      })
      .addCase(fetchSubscriptionEligibility.pending, (state) => {
        state.eligibilityLoading = true;
        state.eligibilityError = null;
      })
      .addCase(fetchSubscriptionEligibility.fulfilled, (state, action) => {
        state.eligibilityLoading = false;
        state.eligibility = action.payload;
      })
      .addCase(fetchSubscriptionEligibility.rejected, (state, action) => {
        state.eligibilityLoading = false;
        state.eligibilityError = action.payload || "Failed to fetch eligibility";
      })
      .addCase(fetchSubscriptionInvoices.pending, (state) => {
        state.invoicesLoading = true;
        state.invoicesError = null;
      })
      .addCase(fetchSubscriptionInvoices.fulfilled, (state, action) => {
        state.invoicesLoading = false;
        state.invoices = action.payload.invoices || [];
      })
      .addCase(fetchSubscriptionInvoices.rejected, (state, action) => {
        state.invoicesLoading = false;
        state.invoicesError = action.payload || "Failed to fetch invoices";
      });
  },
});

export const { clearSubscriptionState } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;



