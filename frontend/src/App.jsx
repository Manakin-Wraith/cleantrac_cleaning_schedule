import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import StaffTasksPage from './pages/StaffTasksPage'; 
import ItemManagementPage from './pages/ItemManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import PageLayout from './components/PageLayout';
import { AuthProvider } from './context/AuthContext'; 
import PrivateRoute from './components/PrivateRoute';
import DepartmentManagementPage from './pages/DepartmentManagementPage';
import ThermometerManagementPage from './pages/ThermometerManagementPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PageLayout showSidebar={false}><LoginPage /></PageLayout>} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute allowedRoles={['manager', 'staff']} />}>
            {/* Routes accessible to managers and staff, further refined by component-level checks if needed */}
            <Route path="/manager-dashboard" element={<PageLayout><ManagerDashboardPage /></PageLayout>} />
            <Route path="/staff-tasks" element={<PageLayout><StaffTasksPage /></PageLayout>} /> 
          </Route>

          <Route element={<PrivateRoute allowedRoles={['manager']} />}>
            {/* Routes accessible primarily to managers (and superusers) */}
            <Route path="/manager-items" element={<PageLayout><ItemManagementPage /></PageLayout>} />
            <Route path="/manager-users" element={<PageLayout><UserManagementPage /></PageLayout>} />
            <Route path="/manager-thermometers" element={<PageLayout><ThermometerManagementPage /></PageLayout>} />
            {/* Department Management - accessible to superusers (full CRUD) and managers (read-only view) */}
            {/* The PrivateRoute allows managers. The component itself handles if a manager can only read. */}
            <Route path="/admin/departments" element={<PageLayout><DepartmentManagementPage /></PageLayout>} />
          </Route>

          <Route path="/" element={<Navigate replace to="/login" />} />
          {/* Add other routes here, wrapping their elements with PageLayout if they need this centering */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
