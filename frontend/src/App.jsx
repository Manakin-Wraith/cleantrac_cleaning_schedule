import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import StaffTasksPage from './pages/StaffTasksPage'; 
import PageLayout from './components/PageLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PageLayout><LoginPage /></PageLayout>} />
        <Route path="/manager-dashboard" element={<PageLayout><ManagerDashboardPage /></PageLayout>} />
        <Route path="/staff-tasks" element={<PageLayout><StaffTasksPage /></PageLayout>} /> 
        <Route path="/" element={<Navigate replace to="/login" />} />
        {/* Add other routes here, wrapping their elements with PageLayout if they need this centering */}
      </Routes>
    </Router>
  );
}

export default App;
