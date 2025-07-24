import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlices';
import businessDetailReducer from './slices/BussinessDetailSlice';
import filterReducer from './slices/FilterSlice';
import projectReducer from './slices/ProjectSlice';

// Example: import your reducers here
// import userReducer from './features/user/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    businessDetail: businessDetailReducer,
    filter: filterReducer,
    project: projectReducer,
  },
});

export default store;