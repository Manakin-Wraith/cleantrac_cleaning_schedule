import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PageLayout from './components/PageLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PageLayout><LoginPage /></PageLayout>} />
        <Route path="/dashboard" element={<PageLayout><DashboardPage /></PageLayout>} />
        <Route path="/" element={<Navigate replace to="/login" />} />
        {/* Add other routes here, wrapping their elements with PageLayout if they need this centering */}
      </Routes>
    </Router>
  );
}

export default App;
