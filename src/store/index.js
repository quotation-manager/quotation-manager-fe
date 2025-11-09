import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

// Import reducers here
import authReducer from './slices/authSlice';
// import userReducer from './slices/userSlice';

const rootReducer = combineReducers({
  // Add reducers here
  auth: authReducer,
  // user: userReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
