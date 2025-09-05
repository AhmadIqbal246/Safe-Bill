import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchAllSellers = createAsyncThunk(
  'filter/fetchAllSellers',
  async ({ minRating } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (minRating !== undefined && minRating !== null && minRating !== '') {
        params.min_rating = minRating;
      }
      const response = await axios.get(`${BASE_URL}api/accounts/all-sellers/`, { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const fetchAllSellersComplete = createAsyncThunk(
  'filter/fetchAllSellersComplete',
  async ({ minRating } = {}, { rejectWithValue }) => {
    try {
      let allSellers = [];
      const params = {};
      if (minRating !== undefined && minRating !== null && minRating !== '') {
        params.min_rating = minRating;
      }
      let nextUrl = `${BASE_URL}api/accounts/all-sellers/`;
      
      // Fetch all pages
      while (nextUrl) {
        const response = await axios.get(nextUrl, { params });
        const data = response.data;
        
        // Add current page results to all sellers
        if (data.results) {
          allSellers = [...allSellers, ...data.results];
        } else if (Array.isArray(data)) {
          // Handle non-paginated response
          allSellers = [...allSellers, ...data];
          break;
        }
        
        // Check if there's a next page
        nextUrl = data.next;
      }
      
      return allSellers;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByRegion = createAsyncThunk(
  'filter/filterSellersByRegion',
  async (regionKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}api/accounts/filter-sellers-by-region/`, {
        params: { region: regionKey }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByServiceType = createAsyncThunk(
  'filter/filterSellersByServiceType',
  async ({ serviceType, minRating }, { rejectWithValue }) => {
    try {
      const params = { service_type: serviceType };
      if (minRating !== undefined && minRating !== null && minRating !== '') {
        params.min_rating = minRating;
      }
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-service-type/`,
        { params }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByServiceArea = createAsyncThunk(
  'filter/filterSellersByServiceArea',
  async ({ serviceArea, minRating }, { rejectWithValue }) => {
    try {
      const params = { service_area: serviceArea };
      if (minRating !== undefined && minRating !== null && minRating !== '') {
        params.min_rating = minRating;
      }
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-service-area/`,
        { params }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByTypeAndArea = createAsyncThunk(
  'filter/filterSellersByTypeAndArea',
  async ({ serviceType, serviceArea, minRating }, { rejectWithValue }) => {
    try {
      const params = { service_type: serviceType, service_area: serviceArea };
      if (minRating !== undefined && minRating !== null && minRating !== '') {
        params.min_rating = minRating;
      }
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-type-and-area/`,
        { params }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersBySkills = createAsyncThunk(
  'filter/filterSellersBySkills',
  async ({ skills, minRating }, { rejectWithValue }) => {
    try {
      const params = { skills: skills.join(',') };
      if (minRating !== undefined && minRating !== null && minRating !== '') {
        params.min_rating = minRating;
      }
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-skills/`,
        { params }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByTypeAreaAndSkills = createAsyncThunk(
  'filter/filterSellersByTypeAreaAndSkills',
  async ({ serviceType, serviceArea, skills, minRating }, { rejectWithValue }) => {
    try {
      const params = { 
        service_type: serviceType, 
        service_area: serviceArea,
        skills: skills.join(',')
      };
      if (minRating !== undefined && minRating !== null && minRating !== '') {
        params.min_rating = minRating;
      }
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-type-area-and-skills/`,
        { params }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Network error');
    }
  }
);

export const filterSellersByLocation = createAsyncThunk(
  'filter/filterSellersByLocation',
  async ({ city, postalCode, address, minRating }, { rejectWithValue }) => {
    try {
      const params = { city, postal_code: postalCode, address };
      if (minRating !== undefined && minRating !== null && minRating !== '') {
        params.min_rating = minRating;
      }
      const response = await axios.get(
        `${BASE_URL}api/accounts/filter-sellers-by-location/`,
        { params }
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
        state.sellers = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
      })
      .addCase(fetchAllSellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllSellersComplete.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSellersComplete.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(fetchAllSellersComplete.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(filterSellersByRegion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSellersByRegion.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
      })
      .addCase(filterSellersByRegion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(filterSellersByServiceType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterSellersByServiceType.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
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
        state.sellers = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
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
        state.sellers = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
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
        state.sellers = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
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
        state.sellers = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
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
        state.sellers = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
      })
      .addCase(filterSellersByLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetFilterState } = filterSlice.actions;
export default filterSlice.reducer;
