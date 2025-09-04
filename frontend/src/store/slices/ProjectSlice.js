import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const createProject = createAsyncThunk(
  'project/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const formData = new FormData();
      formData.append('name', projectData.name);
      formData.append('client_email', projectData.client_email);
      // Quote file
      if (projectData.quote && projectData.quote.file) {
        formData.append('quote.file', projectData.quote.file);
      }
      // Installments as JSON string
      formData.append('installments', JSON.stringify(projectData.installments));
      const response = await axios.post(
        `${BASE_URL}api/projects/create/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
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

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/projects/my-projects/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
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

export const fetchClientProjects = createAsyncThunk(
  'project/fetchClientProjects',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/projects/client-projects/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
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

export const fetchCompletedProjects = createAsyncThunk(
  'project/fetchCompletedProjects',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/projects/completed-projects/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const fetchMilestones = createAsyncThunk(
  'project/fetchMilestones',
  async (projectId, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/projects/projects/${projectId}/milestones/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return { projectId, milestones: response.data };
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const updateMilestone = createAsyncThunk(
  'project/updateMilestone',
  async ({ milestoneId, milestoneData }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const formData = new FormData();
      
      // Add all milestone data to formData
      Object.keys(milestoneData).forEach(key => {
        if (milestoneData[key] !== null && milestoneData[key] !== undefined) {
          if (key === 'supporting_doc' && milestoneData[key] instanceof File) {
            formData.append(key, milestoneData[key]);
          } else {
            formData.append(key, milestoneData[key]);
          }
        }
      });

      const response = await axios.put(
        `${BASE_URL}api/projects/milestones/${milestoneId}/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
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

export const deleteMilestone = createAsyncThunk(
  'project/deleteMilestone',
  async (milestoneId, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      await axios.delete(
        `${BASE_URL}api/projects/milestones/${milestoneId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return milestoneId;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (projectId, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      await axios.delete(
        `${BASE_URL}api/projects/delete/${projectId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return projectId;
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const updateProjectStatus = createAsyncThunk(
  'project/updateProjectStatus',
  async (projectId, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.post(
        `${BASE_URL}api/projects/status-update/${projectId}/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return { projectId, newStatus: response.data.new_status };
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const approveMilestone = createAsyncThunk(
  'project/approveMilestone',
  async ({ milestoneId, action, reviewComment }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const payload = { action };
      
      // Add review comment if provided
      if (reviewComment) {
        payload.review_comment = reviewComment;
      }
      
      const response = await axios.post(
        `${BASE_URL}api/projects/milestones/${milestoneId}/approve/`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { milestoneId, action, data: response.data };
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const fetchClientProjectsWithPendingMilestones = createAsyncThunk(
  'project/fetchClientProjectsWithPendingMilestones',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/projects/client-projects-pending/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
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

export const fetchClientProjectDetail = createAsyncThunk(
  'project/fetchClientProjectDetail',
  async (projectId, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/projects/client-projects/${projectId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
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

export const fetchEligibleProjectsForRating = createAsyncThunk(
  'project/fetchEligibleProjectsForRating',
  async (sellerId, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      const response = await axios.get(
        `${BASE_URL}api/accounts/eligible-projects/${sellerId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { sellerId, projects: response.data };
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

export const submitSellerRating = createAsyncThunk(
  'project/submitSellerRating',
  async ({ sellerId, projectId, rating, comment }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('access');
      await axios.post(
        `${BASE_URL}api/accounts/rate-seller/`,
        { seller: sellerId, project: projectId, rating, comment: comment || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { sellerId, projectId };
    } catch (err) {
      return rejectWithValue(
        err.response && err.response.data ? err.response.data : err.message
      );
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    loading: false,
    error: null,
    success: false,
    project: null,
    projects: [],
    completedProjects: [],
    completedProjectsCount: 0,
    clientProjects: [],
    clientProjectsLoading: false,
    clientProjectsError: null,
    milestones: {}, // Store milestones by projectId
    milestonesLoading: false,
    milestonesError: null,
    milestoneUpdateLoading: false,
    milestoneUpdateError: null,
    approveMilestoneLoading: false,
    approveMilestoneError: null,
    clientProjectsWithPending: [],
    clientProjectsWithPendingLoading: false,
    clientProjectsWithPendingError: null,
    clientProjectDetail: null,
    clientProjectDetailLoading: false,
    clientProjectDetailError: null,
    eligibleProjectsBySeller: {},
    eligibleProjectsLoading: false,
    eligibleProjectsError: null,
    ratingSubmitting: false,
    ratingError: null,
  },
  reducers: {
    resetProjectState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.project = null;
    },
    clearMilestones: (state) => {
      state.milestones = {};
      state.milestonesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.project = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.project = action.payload;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create project';
        state.success = false;
        state.project = null;
      })
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch projects';
      })
      .addCase(fetchCompletedProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompletedProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.completedProjects = action.payload.projects;
        state.completedProjectsCount = action.payload.count;
      })
      .addCase(fetchCompletedProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch completed projects';
      })
      .addCase(fetchClientProjects.pending, (state) => {
        state.clientProjectsLoading = true;
        state.clientProjectsError = null;
      })
      .addCase(fetchClientProjects.fulfilled, (state, action) => {
        state.clientProjectsLoading = false;
        state.clientProjects = action.payload;
      })
      .addCase(fetchClientProjects.rejected, (state, action) => {
        state.clientProjectsLoading = false;
        state.clientProjectsError = action.payload || 'Failed to fetch client projects';
      })
      .addCase(fetchMilestones.pending, (state) => {
        state.milestonesLoading = true;
        state.milestonesError = null;
      })
      .addCase(fetchMilestones.fulfilled, (state, action) => {
        state.milestonesLoading = false;
        const { projectId, milestones } = action.payload;
        state.milestones[projectId] = milestones;
      })
      .addCase(fetchMilestones.rejected, (state, action) => {
        state.milestonesLoading = false;
        state.milestonesError = action.payload || 'Failed to fetch milestones';
      })
      .addCase(updateMilestone.pending, (state) => {
        state.milestoneUpdateLoading = true;
        state.milestoneUpdateError = null;
      })
      .addCase(updateMilestone.fulfilled, (state, action) => {
        state.milestoneUpdateLoading = false;
        // Update the milestone in the appropriate project's milestones
        const updatedMilestone = action.payload;
        Object.keys(state.milestones).forEach(projectId => {
          const projectMilestones = state.milestones[projectId];
          const milestoneIndex = projectMilestones.findIndex(m => m.id === updatedMilestone.id);
          if (milestoneIndex !== -1) {
            state.milestones[projectId][milestoneIndex] = updatedMilestone;
          }
        });
      })
      .addCase(updateMilestone.rejected, (state, action) => {
        state.milestoneUpdateLoading = false;
        state.milestoneUpdateError = action.payload || 'Failed to update milestone';
      })
      .addCase(deleteMilestone.pending, (state) => {
        state.milestoneUpdateLoading = true;
        state.milestoneUpdateError = null;
      })
      .addCase(deleteMilestone.fulfilled, (state, action) => {
        state.milestoneUpdateLoading = false;
        const deletedMilestoneId = action.payload;
        // Remove the milestone from all project milestone lists
        Object.keys(state.milestones).forEach(projectId => {
          state.milestones[projectId] = state.milestones[projectId].filter(
            m => m.id !== deletedMilestoneId
          );
        });
      })
      .addCase(deleteMilestone.rejected, (state, action) => {
        state.milestoneUpdateLoading = false;
        state.milestoneUpdateError = action.payload || 'Failed to delete milestone';
      })
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(p => p.id !== action.payload);
        // Also remove milestones for the deleted project
        delete state.milestones[action.payload];
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete project';
      })
      .addCase(updateProjectStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the project status in the projects list if it exists
        const updatedProject = state.projects.find(p => p.id === action.payload.projectId);
        if (updatedProject) {
          updatedProject.status = action.payload.newStatus;
        }
      })
      .addCase(updateProjectStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update project status';
      })
      .addCase(approveMilestone.pending, (state) => {
        state.approveMilestoneLoading = true;
        state.approveMilestoneError = null;
      })
      .addCase(approveMilestone.fulfilled, (state, action) => {
        state.approveMilestoneLoading = false;
        // Optionally update milestone status in state here if needed
      })
      .addCase(approveMilestone.rejected, (state, action) => {
        state.approveMilestoneLoading = false;
        state.approveMilestoneError = action.payload || 'Failed to update milestone status';
      })
      .addCase(fetchClientProjectsWithPendingMilestones.pending, (state) => {
        state.clientProjectsWithPendingLoading = true;
        state.clientProjectsWithPendingError = null;
      })
      .addCase(fetchClientProjectsWithPendingMilestones.fulfilled, (state, action) => {
        state.clientProjectsWithPendingLoading = false;
        state.clientProjectsWithPending = action.payload;
      })
      .addCase(fetchClientProjectsWithPendingMilestones.rejected, (state, action) => {
        state.clientProjectsWithPendingLoading = false;
        state.clientProjectsWithPendingError = action.payload || 'Failed to fetch projects with pending milestones';
      })
      .addCase(fetchClientProjectDetail.pending, (state) => {
        state.clientProjectDetailLoading = true;
        state.clientProjectDetailError = null;
        state.clientProjectDetail = null;
      })
      .addCase(fetchClientProjectDetail.fulfilled, (state, action) => {
        state.clientProjectDetailLoading = false;
        state.clientProjectDetail = action.payload;
      })
      .addCase(fetchClientProjectDetail.rejected, (state, action) => {
        state.clientProjectDetailLoading = false;
        state.clientProjectDetailError = action.payload || 'Failed to fetch client project detail';
      })
      // Eligible projects for rating
      .addCase(fetchEligibleProjectsForRating.pending, (state) => {
        state.eligibleProjectsLoading = true;
        state.eligibleProjectsError = null;
      })
      .addCase(fetchEligibleProjectsForRating.fulfilled, (state, action) => {
        state.eligibleProjectsLoading = false;
        const { sellerId, projects } = action.payload;
        state.eligibleProjectsBySeller[sellerId] = projects;
      })
      .addCase(fetchEligibleProjectsForRating.rejected, (state, action) => {
        state.eligibleProjectsLoading = false;
        state.eligibleProjectsError = action.payload || 'Failed to load eligible projects';
      })
      // Submit rating
      .addCase(submitSellerRating.pending, (state) => {
        state.ratingSubmitting = true;
        state.ratingError = null;
      })
      .addCase(submitSellerRating.fulfilled, (state, action) => {
        state.ratingSubmitting = false;
        const { sellerId, projectId } = action.payload;
        const list = state.eligibleProjectsBySeller[sellerId] || [];
        state.eligibleProjectsBySeller[sellerId] = list.filter(p => String(p.id) !== String(projectId));
      })
      .addCase(submitSellerRating.rejected, (state, action) => {
        state.ratingSubmitting = false;
        state.ratingError = action.payload || 'Failed to submit rating';
      });
  },
});

export const { resetProjectState, clearMilestones } = projectSlice.actions;
export default projectSlice.reducer;
