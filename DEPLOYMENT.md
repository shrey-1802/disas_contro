DEPLOYMENT & PRODUCTION HARDENING

This file contains recommended deployment steps, security headers for common webservers (Nginx), and build guidance to prepare the frontend for production.

1) What changed in this patch
- frontend/js/auth.js: robust redirect resolution, guardRoute now derives current page if not provided, login returns resolved URL.
- frontend/js/api.js: runtime-configurable API base (window.__ENV__ or meta[name="api-base"]), request timeout, safer JSON handling and mock fallback.
- frontend/env.js: runtime configuration stub (default: API_BASE_URL=/api, ENABLE_QUICK_LOGIN=false). Replace at deploy time if needed.
- frontend/index.html & frontend/login.html: added <base href="./"> and included env.js before other scripts; login quick-login gating now respects runtime flag.
- package.json: added a simple `build` script to copy frontend into `dist/` (useful for basic static hosting).

2) Runtime configuration
- By default env.js sets: window.__ENV__ = { API_BASE_URL: '/api', ENABLE_QUICK_LOGIN: false }.
- For staging/production, replace env.js at deploy time with environment-specific values, or serve an alternative file. Example (staging):
  window.__ENV__ = { API_BASE_URL: 'https://staging-api.example.com/api', ENABLE_QUICK_LOGIN: true };

3) Recommended NGINX headers (example)
Add to your server block (adjust domains and upstreams):

  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  add_header X-XSS-Protection "1; mode=block" always;

Content-Security-Policy (example, adapt for inline styles/scripts):
  # If you have many inline scripts/styles you must either remove them or allow 'unsafe-inline' (not recommended).
  add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://api.example.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:;" always;

4) Build & asset recommendations
- Use a bundler/minifier (esbuild/rollup/webpack) to bundle and minify JS/CSS and produce fingerprints for cache-busting.
- Example with esbuild (recommended):
  npx esbuild frontend/js/*.js --bundle --minify --outdir=dist/js
  copy HTML/CSS/images to dist and replace script tags to reference dist/js/*.js

- Enable gzip/Brotli on your server for text assets.

5) Deployment examples
- Static hosting (Netlify/Vercel): point the site root to the `dist/` folder, set env variable to control quick-login and API base by generating env.js at deploy time.
- Docker + Nginx: build a static `dist/` and serve with Nginx; set headers as above. Reverse-proxy /api to your backend service.

6) Security & operational checklist before go-live
- Remove or disable quick-login and any sample passcodes in production.
- Ensure API endpoint is served over HTTPS and CORS restricts allowed origins.
- Ensure server adds security headers listed above.
- Implement runtime error logging (Sentry or self-hosted) for client JS errors.
- Add simple end-to-end smoke tests (login -> redirect -> sample page load) using Playwright or Cypress.

7) How to enable quick-login for testing
- During staging deploy replace frontend/env.js with:
  window.__ENV__ = { API_BASE_URL: 'https://staging-api.example.com/api', ENABLE_QUICK_LOGIN: true };

8) Rollback guidance
- Keep previous env.js available and use your deployment tool to revert env.js and/or dist to previous version.

If you want, I can:
- Create a follow-up PR that bundles JS with esbuild and updates script tags in the HTML to point to the bundled files (preferred for production).
- Produce per-HTML updates across all pages to include env.js and base tag (I updated index.html and login.html in this patch; I can update all other pages on request).
