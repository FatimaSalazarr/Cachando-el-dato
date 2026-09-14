import { state } from '../core/state.js';

export function initAuthView(navigateToAppCallback) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const goToRegister = document.getElementById('go-to-register');
  const goToLogin = document.getElementById('go-to-login');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnRegisterSubmit = document.getElementById('btn-register-submit');

  if (goToRegister) {
    goToRegister.onclick = () => switchAuthScreen('register-screen');
  }

  if (goToLogin) {
    goToLogin.onclick = () => switchAuthScreen('login-screen');
  }

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email')?.value || 'usuario@ejemplo.com';
    state.currentUser.email = email;
    state.currentUser.name = email.split('@')[0] || 'Usuario';
    navigateToAppCallback('home-screen');
  };

  const handleRegister = (e) => {
    if (e) e.preventDefault();
    const name = document.getElementById('register-name')?.value || 'Usuario';
    const email = document.getElementById('register-email')?.value || 'usuario@ejemplo.com';
    state.currentUser.name = name;
    state.currentUser.email = email;
    navigateToAppCallback('home-screen');
  };

  if (loginForm) {
    loginForm.onsubmit = handleLogin;
  }
  if (btnLoginSubmit) {
    btnLoginSubmit.onclick = handleLogin;
  }

  if (registerForm) {
    registerForm.onsubmit = handleRegister;
  }
  if (btnRegisterSubmit) {
    btnRegisterSubmit.onclick = handleRegister;
  }
}

export function switchAuthScreen(targetScreenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(targetScreenId);
  if (target) {
    target.classList.add('active');
  }
}
