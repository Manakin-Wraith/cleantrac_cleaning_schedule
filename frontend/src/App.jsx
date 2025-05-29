import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { baseTheme, butcheryTheme, bakeryTheme, hmrTheme } from './theme';

import LoginPage from './pages/LoginPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import StaffTasksPage from './pages/StaffTasksPage';
import ItemManagementPage from './pages/ItemManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import PageLayout from './components/PageLayout';
import PrivateRoute from './components/PrivateRoute';
import DepartmentManagementPage from './pages/DepartmentManagementPage';
import ThermometerManagementPage from './pages/ThermometerManagementPage';

// Helper component to apply theme based on auth context
const ThemedApp = () => {
  const { currentUser, isLoading } = useAuth();

  // Determine the theme based on the user's department
  // Assuming currentUser.profile.department_name exists and matches 'Butchery', 'Bakery', 'HMR'
  // Case-insensitive matching for robustness
  const getSelectedTheme = () => {
    if (isLoading || !currentUser || !currentUser.profile || !currentUser.profile.department_name) {
      return baseTheme; // Default theme if loading, no user, or no department info
    }

    const department = currentUser.profile.department_name.toLowerCase();
    switch (department) {
      case 'butchery':
        return butcheryTheme;
      case 'bakery':
        return bakeryTheme;
      case 'hmr': // Assuming 'HMR' is the department name string
        return hmrTheme;
      default:
        return baseTheme; // Fallback to base theme
    }
  };

  const selectedTheme = getSelectedTheme();

  return (
    <ThemeProvider theme={selectedTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<PageLayout showSidebar={false}><LoginPage /></PageLayout>} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute allowedRoles={['manager', 'staff']} />}>
          <Route path="/manager-dashboard" element={<PageLayout><ManagerDashboardPage /></PageLayout>} />
          <Route path="/staff-tasks" element={<PageLayout><StaffTasksPage /></PageLayout>} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={['manager']} />}>
          <Route path="/manager-items" element={<PageLayout><ItemManagementPage /></PageLayout>} />
          <Route path="/manager-users" element={<PageLayout><UserManagementPage /></PageLayout>} />
          <Route path="/manager-thermometers" element={<PageLayout><ThermometerManagementPage /></PageLayout>} />
          <Route path="/admin/departments" element={<PageLayout><DepartmentManagementPage /></PageLayout>} />
        </Route>

        <Route path="/" element={<Navigate replace to="/login" />} />
      </Routes>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </Router>
  );
}

export default App;
