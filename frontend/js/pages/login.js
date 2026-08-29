/**
 * Login Page Controller
 * Relief Supply Chain Resilience & Rerouting System
 */

import { Auth, ROLES } from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const roleSelect = document.getElementById('role-select');
  const usernameInput = document.getElementById('username') || document.getElementById('email-input');
  const passwordInput = document.getElementById('password') || document.getElementById('password-input');
  const errorMessage = document.getElementById('login-error');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput ? usernameInput.value.trim() : '';
      const role = roleSelect ? roleSelect.value : ROLES.CONTROL_ROOM;

      if (!username || !role) {
        if (errorMessage) {
          errorMessage.textContent = 'Please enter username and select operational role.';
          errorMessage.style.display = 'flex';
        }
        return;
      }

      Auth.login(username, role);
      const landingPage = Auth.getLandingPageForRole(role);
      window.location.href = landingPage;
    });
  }
});
