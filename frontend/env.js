// Runtime environment configuration for the frontend.
// Deployers may replace this file at deploy-time or serve a different /env.js
// Example override: set ENABLE_QUICK_LOGIN to true only for staging/test environments.
window.__ENV__ = window.__ENV__ || {
  API_BASE_URL: '/api',
  ENABLE_QUICK_LOGIN: false
};
