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

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    loading: false,
    error: null,
    success: false,
    project: null,
    projects: [],
    clientProjects: [],
    clientProjectsLoading: false,
    clientProjectsError: null,
  },
  reducers: {
    resetProjectState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.project = null;
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
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(p => p.id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete project';
      });
  },
});

export const { resetProjectState } = projectSlice.actions;
export default projectSlice.reducer;
