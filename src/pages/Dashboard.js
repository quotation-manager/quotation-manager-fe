import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import Users from './Users';
import References from './References';
import Customers from './Customers';
import Products from './Products';
import Locations from './Locations';
import Quotations from './Quotations';
import AddQuotation from './AddQuotation';
import EditQuotation from './EditQuotation';
import ViewQuotation from './ViewQuotation';
import ChangePassword from './ChangePassword';
import './Dashboard.css';

const { Content } = Layout;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useSelector(state => state.auth);

  // Determine default route based on user role
  const getDefaultRoute = () => {
    return user?.role === 1 ? '/dashboard/users' : '/dashboard/references';
  };

  return (
    <Layout className="dashboard-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <Layout className={`dashboard-content ${collapsed ? 'collapsed' : ''}`}>
        <Header
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <Content className="main-content">
          <Routes>
            {/* Default redirect based on user role */}
            <Route
              path="/"
              element={<Navigate to={getDefaultRoute()} replace />}
            />

            {/* Admin only routes */}
            <Route
              path="/users"
              element={
                <RoleProtectedRoute allowedRoles={[1]}>
                  <Users />
                </RoleProtectedRoute>
              }
            />

            {/* Routes accessible to both admin and employee */}
            <Route
              path="/references"
              element={
                <RoleProtectedRoute allowedRoles={[1, 2]}>
                  <References />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <RoleProtectedRoute allowedRoles={[1, 2]}>
                  <Customers />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <RoleProtectedRoute allowedRoles={[1, 2]}>
                  <Products />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <RoleProtectedRoute allowedRoles={[1, 2]}>
                  <Locations />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <RoleProtectedRoute allowedRoles={[1, 2]}>
                  <Quotations />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/quotations/add"
              element={
                <RoleProtectedRoute allowedRoles={[1, 2]}>
                  <AddQuotation />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/quotations/edit/:id"
              element={
                <RoleProtectedRoute allowedRoles={[1, 2]}>
                  <EditQuotation />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/quotations/view/:id"
              element={
                <RoleProtectedRoute allowedRoles={[1, 2]}>
                  <ViewQuotation />
                </RoleProtectedRoute>
              }
            />

            {/* Admin only routes */}
            <Route
              path="/change-password"
              element={
                <RoleProtectedRoute allowedRoles={[1]}>
                  <ChangePassword />
                </RoleProtectedRoute>
              }
            />

            {/* Catch all route - redirect to appropriate home */}
            <Route
              path="*"
              element={<Navigate to={getDefaultRoute()} replace />}
            />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
