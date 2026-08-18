/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MenuEditor from './pages/MenuEditor';
import PublicMenu from './pages/PublicMenu';
import SuperAdmin from './pages/SuperAdmin';
import AdminLogin from './pages/AdminLogin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Static Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/superadmin" element={<AdminLogin />} />
          
          {/* Legacy/Direct Public Routes */}
          <Route path="/menu/:businessId" element={<PublicMenu />} />
          
          {/* Admin Routes (Global) */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/editor" element={
            <PrivateRoute>
              <MenuEditor />
            </PrivateRoute>
          } />
          <Route path="/superadmin/dashboard" element={
            <PrivateRoute>
              <SuperAdmin />
            </PrivateRoute>
          } />

          {/* Business-Specific Routes (The New Standard) */}
          <Route path="/:slug" element={<PublicMenu />} />
          <Route path="/:slug/menu" element={<PublicMenu />} />
          <Route path="/:slug/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/:slug/editor" element={
            <PrivateRoute>
              <MenuEditor />
            </PrivateRoute>
          } />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

