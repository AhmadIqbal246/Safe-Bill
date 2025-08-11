import { createSlice } from '@reduxjs/toolkit';

// Placeholder slice for future admin data fetching and actions
const initialState = {
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetAdminState: (state) => {
      state.loading = false;
      state.error = null;
    },
  },
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;

