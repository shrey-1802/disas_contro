/**
 * Login Page Controller
 * Relief Supply Chain Resilience & Rerouting System
 */

import { auth, ROLES } from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already authenticated
  auth.checkSessionGuard();

  const loginForm = document.getElementById('login-form');
  const roleHiddenInput = document.getElementById('role-select');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const errorMessage = document.getElementById('login-error');
  const errorMessageText = document.getElementById('login-error-text');
  const roleCards = document.querySelectorAll('.role-card');

  // Role Default Email Mappings
  const ROLE_EMAILS = {
    [ROLES.CONTROL_ROOM]: 'control.room@disaster.gov',
    [ROLES.DISTRICT_ADMIN]: 'district.admin@disaster.gov',
    [ROLES.FIELD_DRIVER]: 'field.driver@disaster.gov'
  };

  // Interactive Role Card Selection
  function selectRole(selectedRole, cardElem) {
    roleCards.forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-checked', 'false');
    });

    if (cardElem) {
      cardElem.classList.add('selected');
      cardElem.setAttribute('aria-checked', 'true');
    }

    if (roleHiddenInput) {
      roleHiddenInput.value = selectedRole;
    }

    // Auto update email placeholder/value for operator convenience
    if (emailInput && ROLE_EMAILS[selectedRole]) {
      emailInput.value = ROLE_EMAILS[selectedRole];
    }
  }

  roleCards.forEach(card => {
    const roleVal = card.getAttribute('data-role');

    card.addEventListener('click', () => {
      selectRole(roleVal, card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectRole(roleVal, card);
      }
    });
  });

  // Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedRole = roleHiddenInput ? roleHiddenInput.value : ROLES.CONTROL_ROOM;
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!email) {
        showError('Please enter a valid operational identifier or government email.');
        return;
      }

      if (!password) {
        showError('Access credentials password cannot be empty.');
        return;
      }

      const userObj = {
        id: 'usr_' + Date.now().toString(36),
        name: email.split('@')[0].toUpperCase(),
        email: email,
        role: selectedRole
      };

      // Perform authentication login
      auth.login(userObj);

      // Redirect to role landing page explicitly
      const landingPage = auth.getRoleLandingPage(selectedRole);
      window.location.href = landingPage;
    });
  }

  function showError(msg) {
    if (errorMessage && errorMessageText) {
      errorMessageText.textContent = msg;
      errorMessage.classList.remove('hidden');
    }
  }
});
