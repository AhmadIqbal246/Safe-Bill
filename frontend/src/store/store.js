import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlices';
import businessDetailReducer from './slices/BussinessDetailSlice';
import filterReducer from './slices/FilterSlice';
import projectReducer from './slices/ProjectSlice';
import userProfileReducer from './slices/UserProfileSlice';
import notificationReducer from './slices/NotificationSlice';
import feedbackReducer from './slices/FeedbackSlices';
import disputeReducer from './slices/DisputeSlice';
import chatReducer from './slices/ChatSlice';
import adminReducer from './slices/AdminSlice';
import stripeReducer from './slices/ConnectStripe';
import paymentReducer from './slices/PaymentSlice';
import fundsTransferReducer from './slices/FundsTransferSlice';
import subscriptionReducer from './slices/SubscriptionSlice';


// Example: import your reducers here
// import userReducer from './features/user/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    businessDetail: businessDetailReducer,
    filter: filterReducer,
    project: projectReducer,
    userProfile: userProfileReducer,
    notifications: notificationReducer,
    feedback: feedbackReducer,
    dispute: disputeReducer,
    chat: chatReducer,
    admin: adminReducer,
    stripe: stripeReducer,
    payment: paymentReducer,
    fundsTransfer: fundsTransferReducer,
    subscription: subscriptionReducer,
  },
});

export default store;