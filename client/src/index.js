import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Set global API base URL to the deployed backend
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Send cookies with every request (required for HTTP-only JWT auth)
axios.defaults.withCredentials = true;
// Fail fast: don't hang the UI waiting for a slow server response
axios.defaults.timeout = 10000; // 10 seconds

import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
