import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { baseTheme, butcheryTheme, bakeryTheme, hmrTheme } from "./theme";
import CleentracLandingPage from "./pages/CleentracLandingPage";
import LoginPage from './pages/LoginPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import StaffTasksPage from './pages/StaffTasksPage';
import ItemManagementPage from './pages/ItemManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import PageLayout from './components/PageLayout';
import PrivateRoute from './components/PrivateRoute';
import DepartmentManagementPage from './pages/DepartmentManagementPage';
// ThermometerManagementPage removed - simplified navigation
import ThermometerVerificationPage from './pages/ThermometerVerificationPage';
import TemperatureChecksPage from './pages/TemperatureChecksPage';
import DocumentTemplateManagementPage from './pages/DocumentTemplateManagementPage';
import DocumentsManagementPage from './pages/DocumentsManagementPage';
import SupplierManagementPage from './pages/SupplierManagementPage';
import RecipeManagementPage from './pages/RecipeManagementPage';
import ProductionSchedulerPage from './pages/ProductionSchedulerPage';
import TaskSchedulerPage from './pages/TaskSchedulerPage'; // legacy
import UnifiedCalendarPage from './pages/UnifiedCalendarPage';

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
        {/* Public Routes */}
        <Route path="/" element={<CleentracLandingPage />} />
        <Route path="/login" element={<PageLayout showSidebar={false}><LoginPage /></PageLayout>} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute allowedRoles={['manager', 'staff']} />}>
          <Route path="/manager-dashboard" element={<PageLayout><ManagerDashboardPage /></PageLayout>} />
          <Route path="/staff-tasks" element={<PageLayout><StaffTasksPage /></PageLayout>} />
          <Route path="/recipe-management" element={<PageLayout><RecipeManagementPage /></PageLayout>} />
          <Route path="/production-scheduler" element={<PageLayout showHeaderBar={false}><ProductionSchedulerPage /></PageLayout>} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={['manager']} />}>
          <Route path="/manager-items" element={<PageLayout><ItemManagementPage /></PageLayout>} />
          <Route path="/manager-users" element={<PageLayout><UserManagementPage /></PageLayout>} />
          <Route path="/manager-suppliers" element={<PageLayout><SupplierManagementPage /></PageLayout>} />
          <Route path="/manager-thermometers" element={<PageLayout><ThermometerVerificationPage /></PageLayout>} />
          <Route path="/manager-thermometer-verification" element={<PageLayout><ThermometerVerificationPage /></PageLayout>} />
          <Route path="/manager-temperature-checks" element={<PageLayout><TemperatureChecksPage /></PageLayout>} />
          <Route path="/manager-documents" element={<PageLayout><DocumentTemplateManagementPage /></PageLayout>} />
          <Route path="/manager-documents-library" element={<PageLayout><DocumentsManagementPage /></PageLayout>} />

          <Route path="/admin/departments" element={<PageLayout><DepartmentManagementPage /></PageLayout>} />
          <Route path="/manager-schedule" element={<PageLayout showHeaderBar={false}><UnifiedCalendarPage /></PageLayout>} />
        </Route>
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
