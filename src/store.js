import { configureStore } from '@reduxjs/toolkit';
import userReducer from './redux/userSlice';
import reportReducer from './redux/reportSlice'
export const store = configureStore({
    reducer: {
        user: userReducer,
        reports: reportReducer
    },
});


