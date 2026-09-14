import { state } from '../core/state.js';

export function initProfileView(onLogoutCallback) {
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.onclick = () => {
      if (onLogoutCallback) onLogoutCallback();
    };
  }
  renderProfile();
}

export function renderProfile() {
  const nameEl = document.getElementById('profile-user-name');
  const emailEl = document.getElementById('profile-user-email');
  const itemsEl = document.getElementById('profile-items-count');
  const rareEl = document.getElementById('profile-rare-count');
  const legEl = document.getElementById('profile-legendary-count');

  if (nameEl) nameEl.textContent = state.currentUser.name;
  if (emailEl) emailEl.textContent = state.currentUser.email;
  if (itemsEl) itemsEl.textContent = state.currentUser.itemsCount;
  if (rareEl) rareEl.textContent = state.currentUser.rareCount;
  if (legEl) legEl.textContent = state.currentUser.legendaryCount;

  state.syncPointsDisplay();
}
