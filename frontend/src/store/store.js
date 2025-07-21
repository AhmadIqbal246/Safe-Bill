import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlices';
import businessDetailReducer from './slices/BussinessDetailSlice';

// Example: import your reducers here
// import userReducer from './features/user/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    businessDetail: businessDetailReducer,
  },
});

export default store;