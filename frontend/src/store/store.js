import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlices';

// Example: import your reducers here
// import userReducer from './features/user/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;