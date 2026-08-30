// Runtime environment configuration for the frontend.
// Deployers may replace this file at deploy-time or serve a different /env.js
// Environment variables can be set via:
// - Direct replacement of this file during deployment
// - Environment variable substitution at build/deploy time
// - Server-side configuration at runtime

window.__ENV__ = window.__ENV__ || {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000',
  ENABLE_QUICK_LOGIN: process.env.REACT_APP_ENABLE_QUICK_LOGIN === 'true' || false,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Validate critical configuration
if (!window.__ENV__.API_BASE_URL) {
  console.error('Critical: API_BASE_URL is not configured');
}
