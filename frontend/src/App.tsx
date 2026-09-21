import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SuperAdminLogin } from './pages/SuperAdminLogin';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { ProjectUserLogin } from './pages/ProjectUserLogin';
import { ProjectSiteView } from './pages/ProjectSiteView';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Master SuperAdmin Routes */}
          <Route path="/login" element={<SuperAdminLogin />} />
          <Route path="/admin" element={<SuperAdminDashboard />} />

          {/* Tenant Sub-project Routes */}
          <Route path="/sitio/:slug/login" element={<ProjectUserLogin />} />
          <Route path="/sitio/:slug" element={<ProjectSiteView />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
