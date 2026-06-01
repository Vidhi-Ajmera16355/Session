import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Set global API base URL to the deployed backend
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'https://session-psi.vercel.app';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
