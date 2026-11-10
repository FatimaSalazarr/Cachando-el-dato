import { state } from '../core/state.js';
import { apiRequest } from '../core/api.js';
import { showAppAlert } from '../core/alerts.js';

export function initAuthView(navigateToAppCallback) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const goToRegister = document.getElementById('go-to-register');
  const goToLogin = document.getElementById('go-to-login');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  const resetPasswordForm = document.getElementById('reset-password-form');
  const loginLinks = document.getElementById('login-links');
  const authStatus = document.getElementById('auth-status');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnRegisterSubmit = document.getElementById('btn-register-submit');
  const registerPhotoInput = document.getElementById('register-photo');
  const registerPhotoImage = document.getElementById('register-photo-image');
  const registerPhotoStatus = document.getElementById('register-photo-status');
  let registerPhotoPreviewUrl = null;

  if (registerPhotoInput) {
    registerPhotoInput.onchange = () => {
      const file = registerPhotoInput.files?.[0];
      if (registerPhotoPreviewUrl) URL.revokeObjectURL(registerPhotoPreviewUrl);
      registerPhotoPreviewUrl = null;

      if (!file) {
        if (registerPhotoImage) {
          registerPhotoImage.hidden = true;
          registerPhotoImage.removeAttribute('src');
        }
        if (registerPhotoStatus) registerPhotoStatus.textContent = 'Elige una imagen JPG, PNG o WebP; se optimizará al registrarte.';
        return;
      }

      if (!file.type.startsWith('image/')) {
        registerPhotoInput.value = '';
        if (registerPhotoImage) {
          registerPhotoImage.hidden = true;
          registerPhotoImage.removeAttribute('src');
        }
        if (registerPhotoStatus) registerPhotoStatus.textContent = 'Selecciona un archivo de imagen válido.';
        return;
      }

      registerPhotoPreviewUrl = URL.createObjectURL(file);
      if (registerPhotoImage) {
        registerPhotoImage.src = registerPhotoPreviewUrl;
        registerPhotoImage.hidden = false;
      }
      if (registerPhotoStatus) registerPhotoStatus.textContent = file.name;
    };
  }

  if (goToRegister) {
    goToRegister.onclick = () => switchAuthScreen('register-screen');
  }

  if (goToLogin) {
    goToLogin.onclick = () => switchAuthScreen('login-screen');
  }

  const showLoginForm = () => {
    if (loginForm) loginForm.hidden = false;
    if (forgotPasswordForm) forgotPasswordForm.hidden = true;
    if (resetPasswordForm) resetPasswordForm.hidden = true;
    if (loginLinks) loginLinks.hidden = false;
  };

  const resetLinkToken = new URLSearchParams(window.location.hash.slice(1)).get('reset');
  if (resetLinkToken) {
    if (loginForm) loginForm.hidden = true;
    if (forgotPasswordForm) forgotPasswordForm.hidden = true;
    if (resetPasswordForm) resetPasswordForm.hidden = false;
    if (loginLinks) loginLinks.hidden = true;
    if (authStatus) authStatus.textContent = 'El enlace es de un solo uso y vence en una hora.';
  }

  if (forgotPasswordLink && forgotPasswordForm) {
    forgotPasswordLink.onclick = () => {
      if (loginForm) loginForm.hidden = true;
      forgotPasswordForm.hidden = false;
      if (resetPasswordForm) resetPasswordForm.hidden = true;
      if (loginLinks) loginLinks.hidden = true;
      if (authStatus) authStatus.textContent = '';
      const email = document.getElementById('login-email')?.value || '';
      const forgotEmail = document.getElementById('forgot-password-email');
      if (forgotEmail) forgotEmail.value = email;
    };
  }

  const backToLogin = document.getElementById('back-to-login');
  if (backToLogin) {
    backToLogin.onclick = () => {
      showLoginForm();
      if (authStatus) authStatus.textContent = '';
    };
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.onsubmit = async (event) => {
      event.preventDefault();
      const email = document.getElementById('forgot-password-email')?.value.trim();
      const submitButton = document.getElementById('btn-forgot-password');
      if (!email) return;

      if (submitButton) submitButton.disabled = true;
      if (authStatus) authStatus.textContent = 'Enviando solicitud...';
      try {
        const { mensaje } = await apiRequest('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        if (authStatus) authStatus.textContent = mensaje;
      } catch (error) {
        console.error('Error al solicitar el restablecimiento:', error);
        if (authStatus) authStatus.textContent = error.message || 'No se pudo enviar la solicitud.';
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    };
  }

  const backFromReset = document.getElementById('back-from-reset');
  if (backFromReset) {
    backFromReset.onclick = () => {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      showLoginForm();
      if (authStatus) authStatus.textContent = '';
    };
  }

  if (resetPasswordForm) {
    resetPasswordForm.onsubmit = async (event) => {
      event.preventDefault();
      const password = document.getElementById('reset-password')?.value || '';
      const confirmation = document.getElementById('reset-password-confirm')?.value || '';
      const submitButton = document.getElementById('btn-reset-password');
      if (password !== confirmation) {
        if (authStatus) authStatus.textContent = 'Las contraseñas no coinciden.';
        return;
      }
      if (!resetLinkToken) {
        if (authStatus) authStatus.textContent = 'El enlace de restablecimiento no es válido.';
        return;
      }

      if (submitButton) submitButton.disabled = true;
      if (authStatus) authStatus.textContent = 'Actualizando contraseña...';
      try {
        const { mensaje } = await apiRequest('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: resetLinkToken, password })
        });
        resetPasswordForm.reset();
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        showLoginForm();
        if (authStatus) authStatus.textContent = mensaje;
      } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        if (authStatus) authStatus.textContent = error.message || 'No se pudo restablecer la contraseña.';
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    };
  }

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) return;

    if (btnLoginSubmit) btnLoginSubmit.disabled = true;
    try {
      const { token, usuario } = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      state.setSession({
        id: usuario.id,
        token,
        name: usuario.username,
        email: usuario.email || email.trim().toLowerCase(),
        points: usuario.puntos || 0,
        fotoPerfil: usuario.fotoPerfil || ''
      });
      const { items } = await apiRequest('/game/inventario');
      state.setInventory(items);
      navigateToAppCallback('home-screen');
    } catch (error) {
      state.clearSession();
      console.error('Error al iniciar sesión:', error);
      await showAppAlert({
        icon: 'error',
        title: 'No se pudo iniciar sesión',
        text: error.message || 'Intenta verificar tus datos e inténtalo de nuevo.'
      });
    } finally {
      if (btnLoginSubmit) btnLoginSubmit.disabled = false;
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    
    const name = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    const photoFile = registerPhotoInput?.files?.[0];

    if (!name || !email || !password) {
      await showAppAlert({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, llena todos los campos.'
      });
      return;
    }

    if (btnRegisterSubmit) btnRegisterSubmit.disabled = true;
    try {
      const fotoPerfil = photoFile ? await compressProfilePhoto(photoFile) : '';
      await apiRequest('/auth/registro', {
        method: 'POST',
        body: JSON.stringify({ username: name, email, password, fotoPerfil })
      });
      await showAppAlert({
        icon: 'success',
        title: 'Registro exitoso',
        text: 'Ahora puedes iniciar sesión.'
      });
      if (registerForm) registerForm.reset();
      if (registerPhotoImage) {
        registerPhotoImage.hidden = true;
        registerPhotoImage.removeAttribute('src');
      }
      if (registerPhotoPreviewUrl) URL.revokeObjectURL(registerPhotoPreviewUrl);
      registerPhotoPreviewUrl = null;
      if (registerPhotoStatus) registerPhotoStatus.textContent = 'Elige una imagen JPG, PNG o WebP; se optimizará al registrarte.';
      switchAuthScreen('login-screen');
    } catch (error) {
      console.error('Error de red o servidor:', error);
      await showAppAlert({
        icon: 'error',
        title: 'No se pudo completar el registro',
        text: error.message || 'Error al conectar con el servidor.'
      });
    } finally {
      if (btnRegisterSubmit) btnRegisterSubmit.disabled = false;
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
}

async function compressProfilePhoto(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen debe pesar menos de 10 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const maxDimension = 256;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.72, 0.55, 0.4]) {
    const fotoPerfil = canvas.toDataURL('image/jpeg', quality);
    if (fotoPerfil.length <= 85000) return fotoPerfil;
  }

  throw new Error('No se pudo comprimir la foto lo suficiente. Elige otra imagen.');
}

export function switchAuthScreen(targetScreenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(targetScreenId);
  if (target) {
    target.classList.add('active');
  }
}