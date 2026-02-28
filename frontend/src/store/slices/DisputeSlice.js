import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import i18n from '../../i18n';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async thunks
export const fetchDisputes = createAsyncThunk(
  'dispute/fetchDisputes',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(`${BASE_URL}api/disputes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const fetchDisputeDetail = createAsyncThunk(
  'dispute/fetchDisputeDetail',
  async (disputeId, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(`${BASE_URL}api/disputes/${disputeId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const fetchAvailableProjects = createAsyncThunk(
  'dispute/fetchAvailableProjects',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(`${BASE_URL}api/disputes/available-projects/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const createDispute = createAsyncThunk(
  'dispute/createDispute',
  async (disputeData, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('project', disputeData.project);
      formData.append('dispute_type', disputeData.dispute_type);
      formData.append('title', disputeData.title);
      formData.append('description', disputeData.description);
      
      // Append documents if any
      if (disputeData.documents && disputeData.documents.length > 0) {
        disputeData.documents.forEach((file, index) => {
          formData.append(`documents`, file);
        });
      }
      
      const response = await axios.post(`${BASE_URL}api/disputes/create/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'X-User-Language': i18n.language,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const updateDispute = createAsyncThunk(
  'dispute/updateDispute',
  async ({ disputeId, updateData }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.patch(`${BASE_URL}api/disputes/${disputeId}/update/`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const assignMediator = createAsyncThunk(
  'dispute/assignMediator',
  async ({ disputeId, mediatorId }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.post(`${BASE_URL}api/disputes/${disputeId}/assign-mediator/`, {
        mediator_id: mediatorId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const resolveDispute = createAsyncThunk(
  'dispute/resolveDispute',
  async ({ disputeId, resolutionData }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.post(`${BASE_URL}api/disputes/${disputeId}/resolve/`, resolutionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const addDisputeComment = createAsyncThunk(
  'dispute/addDisputeComment',
  async ({ disputeId, comment }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.post(`${BASE_URL}api/disputes/${disputeId}/comments/`, {
        content: comment
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

const disputeSlice = createSlice({
  name: 'dispute',
  initialState: {
    disputes: [],
    disputesLoading: false,
    disputesError: null,
    
    disputeDetail: null,
    disputeDetailLoading: false,
    disputeDetailError: null,
    
    availableProjects: [],
    availableProjectsLoading: false,
    availableProjectsError: null,
    
    createDisputeLoading: false,
    createDisputeError: null,
    
    updateDisputeLoading: false,
    updateDisputeError: null,
    
    assignMediatorLoading: false,
    assignMediatorError: null,
    
    resolveDisputeLoading: false,
    resolveDisputeError: null,
    
    addCommentLoading: false,
    addCommentError: null,
  },
  reducers: {
    clearDisputeErrors: (state) => {
      state.disputesError = null;
      state.disputeDetailError = null;
      state.availableProjectsError = null;
      state.createDisputeError = null;
      state.updateDisputeError = null;
      state.assignMediatorError = null;
      state.resolveDisputeError = null;
      state.addCommentError = null;
    },
    clearDisputeDetail: (state) => {
      state.disputeDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch disputes
      .addCase(fetchDisputes.pending, (state) => {
        state.disputesLoading = true;
        state.disputesError = null;
      })
      .addCase(fetchDisputes.fulfilled, (state, action) => {
        state.disputesLoading = false;
        state.disputes = action.payload;
      })
      .addCase(fetchDisputes.rejected, (state, action) => {
        state.disputesLoading = false;
        state.disputesError = action.payload || 'Failed to fetch disputes';
      })
      
      // Fetch dispute detail
      .addCase(fetchDisputeDetail.pending, (state) => {
        state.disputeDetailLoading = true;
        state.disputeDetailError = null;
        state.disputeDetail = null;
      })
      .addCase(fetchDisputeDetail.fulfilled, (state, action) => {
        state.disputeDetailLoading = false;
        state.disputeDetail = action.payload;
      })
      .addCase(fetchDisputeDetail.rejected, (state, action) => {
        state.disputeDetailLoading = false;
        state.disputeDetailError = action.payload || 'Failed to fetch dispute detail';
      })
      
      // Fetch available projects
      .addCase(fetchAvailableProjects.pending, (state) => {
        state.availableProjectsLoading = true;
        state.availableProjectsError = null;
      })
      .addCase(fetchAvailableProjects.fulfilled, (state, action) => {
        state.availableProjectsLoading = false;
        state.availableProjects = action.payload;
      })
      .addCase(fetchAvailableProjects.rejected, (state, action) => {
        state.availableProjectsLoading = false;
        state.availableProjectsError = action.payload || 'Failed to fetch available projects';
      })
      
      // Create dispute
      .addCase(createDispute.pending, (state) => {
        state.createDisputeLoading = true;
        state.createDisputeError = null;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.createDisputeLoading = false;
        state.disputes.unshift(action.payload);
      })
      .addCase(createDispute.rejected, (state, action) => {
        state.createDisputeLoading = false;
        state.createDisputeError = action.payload || 'Failed to create dispute';
      })
      
      // Update dispute
      .addCase(updateDispute.pending, (state) => {
        state.updateDisputeLoading = true;
        state.updateDisputeError = null;
      })
      .addCase(updateDispute.fulfilled, (state, action) => {
        state.updateDisputeLoading = false;
        const index = state.disputes.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.disputes[index] = action.payload;
        }
        if (state.disputeDetail && state.disputeDetail.id === action.payload.id) {
          state.disputeDetail = action.payload;
        }
      })
      .addCase(updateDispute.rejected, (state, action) => {
        state.updateDisputeLoading = false;
        state.updateDisputeError = action.payload || 'Failed to update dispute';
      })
      
      // Assign mediator
      .addCase(assignMediator.pending, (state) => {
        state.assignMediatorLoading = true;
        state.assignMediatorError = null;
      })
      .addCase(assignMediator.fulfilled, (state) => {
        state.assignMediatorLoading = false;
      })
      .addCase(assignMediator.rejected, (state, action) => {
        state.assignMediatorLoading = false;
        state.assignMediatorError = action.payload || 'Failed to assign mediator';
      })
      
      // Resolve dispute
      .addCase(resolveDispute.pending, (state) => {
        state.resolveDisputeLoading = true;
        state.resolveDisputeError = null;
      })
      .addCase(resolveDispute.fulfilled, (state) => {
        state.resolveDisputeLoading = false;
      })
      .addCase(resolveDispute.rejected, (state, action) => {
        state.resolveDisputeLoading = false;
        state.resolveDisputeError = action.payload || 'Failed to resolve dispute';
      })
      
      // Add comment
      .addCase(addDisputeComment.pending, (state) => {
        state.addCommentLoading = true;
        state.addCommentError = null;
      })
      .addCase(addDisputeComment.fulfilled, (state, action) => {
        state.addCommentLoading = false;
        if (state.disputeDetail) {
          state.disputeDetail.comments.push(action.payload);
        }
      })
      .addCase(addDisputeComment.rejected, (state, action) => {
        state.addCommentLoading = false;
        state.addCommentError = action.payload || 'Failed to add comment';
      });
  },
});

export const { clearDisputeErrors, clearDisputeDetail } = disputeSlice.actions;
export default disputeSlice.reducer;
