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

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    
    const name = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;

    if (!name || !email || !password) {
      alert('Por favor, llena todos los campos.');
      return;
    }

    try {
      const respuesta = await fetch('http://localhost:3000/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: name, email, password })
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        if (registerForm) registerForm.reset();
        switchAuthScreen('login-screen');
      } else {
        alert(`Error en el registro: ${datos.error}`);
      }
    } catch (error) {
      console.error('Error de red o servidor:', error);
      alert('Error al conectar con el servidor.');
    }
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