import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import StaffTasksPage from './pages/StaffTasksPage'; 
import ItemManagementPage from './pages/ItemManagementPage';
import PageLayout from './components/PageLayout';
import { AuthProvider } from './context/AuthContext'; 

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PageLayout><LoginPage /></PageLayout>} />
          <Route path="/manager-dashboard" element={<PageLayout><ManagerDashboardPage /></PageLayout>} />
          <Route path="/manager-items" element={<PageLayout><ItemManagementPage /></PageLayout>} />
          <Route path="/staff-tasks" element={<PageLayout><StaffTasksPage /></PageLayout>} /> 
          <Route path="/" element={<Navigate replace to="/login" />} />
          {/* Add other routes here, wrapping their elements with PageLayout if they need this centering */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
