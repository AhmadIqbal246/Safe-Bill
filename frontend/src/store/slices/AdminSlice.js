import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosSetup';
import { toast } from 'react-toastify';

const initialState = {
  loading: false,
  error: null,
  overview: {
    kpis: { userCount: 0, transactions: 0, disputes: 0 },
    registrationTrend: [],
    revenueBars: [],
  },
  professionals: [],
  clients: [],
  currentAdmins: [],
  disputes: [], // super-admin view
  assignedDisputes: [], // admin view
  // Revenue management state
  revenue: {
    summary: null,
    total: null,
    months: [],
    currentMonth: null,
  },
  // Payment management state
  payments: {
    paid: [],
    transfers: [],
  },
};

// Thunks
export const fetchOverview = createAsyncThunk(
  'admin/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/overview/');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load overview' });
    }
  }
);

export const fetchUsersByRole = createAsyncThunk(
  'admin/fetchUsersByRole',
  async (role, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`api/admin/users/?role=${role}`);
      return { role, results: data.results || [] };
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: `Failed to load ${role} users` });
    }
  }
);

export const fetchCurrentAdmins = createAsyncThunk(
  'admin/fetchCurrentAdmins',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/super-admin/current-admins/');
      return data.results || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load admins' });
    }
  }
);

export const toggleAdmin = createAsyncThunk(
  'admin/toggleAdmin',
  async ({ userId, isAdmin }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('api/admin/super-admin/manage-admin/', {
        user_id: userId,
        is_admin: isAdmin,
      });
      toast.success('Admin status updated');
      return { userId, isAdmin, server: data };
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update admin status');
      return rejectWithValue(err.response?.data || { detail: 'Failed to update admin status' });
    }
  }
);

export const fetchSuperAdminDisputes = createAsyncThunk(
  'admin/fetchSuperAdminDisputes',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/super-admin/disputes/');
      return data.results || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load disputes' });
    }
  }
);

export const assignMediator = createAsyncThunk(
  'admin/assignMediator',
  async ({ disputeId, mediatorId }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('api/admin/super-admin/assign-mediator/', {
        dispute_id: disputeId,
        mediator_id: mediatorId,
      });
      toast.success('Mediator assigned');
      return { disputeId, mediatorId, server: data };
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign mediator');
      return rejectWithValue(err.response?.data || { detail: 'Failed to assign mediator' });
    }
  }
);

export const fetchAdminAssignedDisputes = createAsyncThunk(
  'admin/fetchAdminAssignedDisputes',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/admin/assigned-disputes/');
      return data.results || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load my disputes' });
    }
  }
);

export const mediatorUpdateStatus = createAsyncThunk(
  'admin/mediatorUpdateStatus',
  async ({ disputeId, newStatus }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('api/admin/admin/mediator/update-status/', {
        dispute_id: disputeId,
        new_status: newStatus,
      });
      toast.success('Dispute status updated');
      return { disputeId, status: data.status };
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
      return rejectWithValue(err.response?.data || { detail: 'Failed to update status' });
    }
  }
);

// Revenue Management Thunks
export const fetchRevenueSummary = createAsyncThunk(
  'admin/fetchRevenueSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/revenue/summary/');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load revenue summary' });
    }
  }
);

export const fetchTotalRevenue = createAsyncThunk(
  'admin/fetchTotalRevenue',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/revenue/total/');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load total revenue' });
    }
  }
);

export const fetchRevenueMonths = createAsyncThunk(
  'admin/fetchRevenueMonths',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/revenue/months/');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load revenue months' });
    }
  }
);

export const fetchMonthlyRevenue = createAsyncThunk(
  'admin/fetchMonthlyRevenue',
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`api/admin/revenue/month/${year}/${month}/`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load monthly revenue' });
    }
  }
);

export const recalculateMonthlyRevenue = createAsyncThunk(
  'admin/recalculateMonthlyRevenue',
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`api/admin/revenue/recalculate/${year}/${month}/`);
      toast.success(`Revenue recalculated for ${year}-${month.toString().padStart(2, '0')}`);
      return data;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to recalculate revenue');
      return rejectWithValue(err.response?.data || { detail: 'Failed to recalculate revenue' });
    }
  }
);

// Payment Management Thunks
export const fetchPaidPayments = createAsyncThunk(
  'admin/fetchPaidPayments',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/payments/paid/');
      return data.results || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load paid payments' });
    }
  }
);

export const fetchTransfers = createAsyncThunk(
  'admin/fetchTransfers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('api/admin/transfers/');
      return data.results || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || { detail: 'Failed to load transfers' });
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetAdminState: (state) => {
      state.loading = false;
      state.error = null;
      state.overview = initialState.overview;
      state.professionals = [];
      state.clients = [];
      state.currentAdmins = [];
      state.disputes = [];
      state.assignedDisputes = [];
      state.revenue = initialState.revenue;
      state.payments = initialState.payments;
    },
  },
  extraReducers: (builder) => {
    builder
      // Overview
      .addCase(fetchOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        const d = action.payload;
        state.overview = {
          kpis: d.kpis || initialState.overview.kpis,
          registrationTrend: d.registrationTrend || [],
          revenueBars: d.revenueBars || [],
        };
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload?.detail || 'Failed to load overview');
      })
      // Users
      .addCase(fetchUsersByRole.fulfilled, (state, action) => {
        const { role, results } = action.payload;
        if (role === 'seller') state.professionals = results;
        if (role === 'buyer') state.clients = results;
      })
      // Current admins
      .addCase(fetchCurrentAdmins.fulfilled, (state, action) => {
        state.currentAdmins = action.payload;
      })
      // Toggle admin
      .addCase(toggleAdmin.fulfilled, (state, action) => {
        const { userId, isAdmin } = action.payload;
        state.professionals = state.professionals.map(u => u.id === userId ? { ...u, is_admin: isAdmin } : u);
        state.clients = state.clients.map(u => u.id === userId ? { ...u, is_admin: isAdmin } : u);
      })
      // Disputes (super admin)
      .addCase(fetchSuperAdminDisputes.fulfilled, (state, action) => {
        state.disputes = action.payload;
      })
      // Assign mediator
      .addCase(assignMediator.fulfilled, (state, action) => {
        const { disputeId, server } = action.payload;
        state.disputes = state.disputes.map(d => d.id === disputeId ? {
          ...d,
          status: server.status || d.status,
          assigned_mediator: server.mediator || d.assigned_mediator,
        } : d);
      })
      // Admin assigned disputes
      .addCase(fetchAdminAssignedDisputes.fulfilled, (state, action) => {
        state.assignedDisputes = action.payload;
      })
      // Mediator updates status
      .addCase(mediatorUpdateStatus.fulfilled, (state, action) => {
        const { disputeId, status } = action.payload;
        state.assignedDisputes = state.assignedDisputes.map(d => d.id === disputeId ? { ...d, status } : d);
        state.disputes = state.disputes.map(d => d.id === disputeId ? { ...d, status } : d);
      })
      // Revenue Management
      .addCase(fetchRevenueSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.revenue.summary = action.payload;
        state.revenue.currentMonth = action.payload.current_month;
      })
      .addCase(fetchRevenueSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload?.detail || 'Failed to load revenue summary');
      })
      .addCase(fetchTotalRevenue.fulfilled, (state, action) => {
        state.revenue.total = action.payload;
      })
      .addCase(fetchRevenueMonths.fulfilled, (state, action) => {
        state.revenue.months = action.payload;
      })
      .addCase(fetchMonthlyRevenue.fulfilled, (state, action) => {
        // Update the specific month in the months array or add it
        const monthData = action.payload;
        const existingIndex = state.revenue.months.findIndex(
          m => m.year === monthData.year && m.month === monthData.month
        );
        if (existingIndex >= 0) {
          state.revenue.months[existingIndex] = monthData;
        } else {
          state.revenue.months.push(monthData);
        }
      })
      .addCase(recalculateMonthlyRevenue.fulfilled, (state, action) => {
        // Update the recalculated month data
        const monthData = action.payload;
        const existingIndex = state.revenue.months.findIndex(
          m => m.year === monthData.year && m.month === monthData.month
        );
        if (existingIndex >= 0) {
          state.revenue.months[existingIndex] = monthData;
        } else {
          state.revenue.months.push(monthData);
        }
        // Update summary if it's the current month
        if (state.revenue.summary && 
            state.revenue.summary.current_month.year === monthData.year && 
            state.revenue.summary.current_month.month === monthData.month) {
          state.revenue.summary.current_month = monthData;
        }
      })
      // Payment Management
      .addCase(fetchPaidPayments.fulfilled, (state, action) => {
        state.payments.paid = action.payload;
      })
      .addCase(fetchTransfers.fulfilled, (state, action) => {
        state.payments.transfers = action.payload;
      });
  }
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;

