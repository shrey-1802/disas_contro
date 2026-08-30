// Runtime environment configuration for the frontend.
// Deployers may replace this file at deploy-time or serve a different /env.js
// Environment variables should be injected at build time or via HTML globals

window.__ENV__ = window.__ENV__ || {
  API_BASE_URL: 'http://localhost:3000/api/v1',
  SOCKET_URL: 'http://localhost:3000',
  ENABLE_QUICK_LOGIN: false,
  NODE_ENV: 'development'
};

// Validate critical configuration
if (!window.__ENV__.API_BASE_URL) {
  console.error('Critical: API_BASE_URL is not configured');
}
