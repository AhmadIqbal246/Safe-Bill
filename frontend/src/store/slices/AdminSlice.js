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
      });
  }
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;

