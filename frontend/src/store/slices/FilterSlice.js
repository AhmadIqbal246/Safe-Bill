import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchAllSellers = createAsyncThunk(
  'filter/fetchAllSellers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}api/accounts/all-sellers/`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByServiceType = createAsyncThunk(
  'filter/filterSellersByServiceType',
  async (serviceType, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-service-type/`,
        { params: { service_type: serviceType } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByServiceArea = createAsyncThunk(
  'filter/filterSellersByServiceArea',
  async (serviceArea, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-service-area/`,
        { params: { service_area: serviceArea } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByTypeAndArea = createAsyncThunk(
  'filter/filterSellersByTypeAndArea',
  async ({ serviceType, serviceArea }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-type-and-area/`,
        { params: { service_type: serviceType, service_area: serviceArea } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersBySkills = createAsyncThunk(
  'filter/filterSellersBySkills',
  async (skills, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-skills/`,
        { params: { skills: skills.join(',') } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByTypeAreaAndSkills = createAsyncThunk(
  'filter/filterSellersByTypeAreaAndSkills',
  async ({ serviceType, serviceArea, skills }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-type-area-and-skills/`,
        { 
          params: { 
            service_type: serviceType, 
            service_area: serviceArea,
            skills: skills.join(',')
          } 
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByLocation = createAsyncThunk(
  'filter/filterSellersByLocation',
  async ({ city, postalCode, address }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-location/`,
        { params: { city, postal_code: postalCode, address } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

const filterSlice = createSlice({
  name: 'filter',
  initialState: {
    loading: false,
    error: null,
    sellers: [],
  },
  reducers: {
    resetFilterState: (state) => {
      state.loading = false;
      state.error = null;
      state.sellers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSellers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSellers.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(fetchAllSellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(filterSellersByServiceType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSellersByServiceType.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(filterSellersByServiceType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(filterSellersByServiceArea.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSellersByServiceArea.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(filterSellersByServiceArea.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(filterSellersByTypeAndArea.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSellersByTypeAndArea.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(filterSellersByTypeAndArea.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(filterSellersBySkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSellersBySkills.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(filterSellersBySkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(filterSellersByTypeAreaAndSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSellersByTypeAreaAndSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(filterSellersByTypeAreaAndSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(filterSellersByLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSellersByLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(filterSellersByLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetFilterState } = filterSlice.actions;
export default filterSlice.reducer;
