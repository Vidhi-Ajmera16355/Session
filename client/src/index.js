import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Set global API base URL to the deployed backend
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Send cookies with every request (required for HTTP-only JWT auth)
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
