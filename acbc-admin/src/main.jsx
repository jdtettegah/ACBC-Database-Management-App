import React from 'react';
import ReactDOM from 'react-dom/client';import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import PastorDashboard from './pages/dashboards/PastorDashboard.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import { registerSW } from "virtual:pwa-register";

import { initTheme } from './utils/theme';

import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';

initTheme();

registerSW({
  immediate: true
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
