import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';

const PrivateRoute = ({ children }) => {
    const user = useSelector(selectUser);
    
    return user ? children : <Navigate to="/Signin" />;
};

export default PrivateRoute;
