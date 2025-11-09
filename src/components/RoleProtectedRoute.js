import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no user data, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;

  // If user role is not in allowed roles, redirect to appropriate home page
  if (!allowedRoles.includes(userRole)) {
    // Admin (role 1) goes to users page, Employee (role 2) goes to references page
    const redirectPath =
      userRole === 1 ? '/dashboard/users' : '/dashboard/references';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleProtectedRoute;
