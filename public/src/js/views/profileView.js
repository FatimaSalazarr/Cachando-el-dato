import { state } from '../core/state.js';
import { apiRequest } from '../core/api.js';

let profileRequestId = 0;

export function initProfileView(onLogoutCallback) {
  const btnLogout = document.getElementById('btn-logout');
  const btnEdit = document.getElementById('btn-edit-profile');
  const editModal = document.getElementById('profile-edit-modal');
  const editForm = document.getElementById('profile-edit-form');
  const btnCancelEdit = document.getElementById('btn-cancel-profile-edit');
  const photoInput = document.getElementById('edit-profile-photo');
  const photoPreview = document.getElementById('edit-profile-photo-preview');
  const removePhoto = document.getElementById('remove-profile-photo');
  let photoPreviewUrl = null;
  const resetPhotoPreview = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    photoPreviewUrl = null;
  };

  if (btnLogout) {
    btnLogout.onclick = () => {
      if (onLogoutCallback) onLogoutCallback();
    };
  }
  if (btnEdit && editModal) {
    btnEdit.onclick = () => {
      resetPhotoPreview();
      openProfileEditor(editModal, photoPreview, removePhoto);
    };
  }
  if (btnCancelEdit && editModal) {
    btnCancelEdit.onclick = () => {
      resetPhotoPreview();
      closeProfileEditor(editModal);
    };
  }
  if (editModal) {
    editModal.onclick = (event) => {
      if (event.target === editModal) {
        resetPhotoPreview();
        closeProfileEditor(editModal);
      }
    };
  }
  if (photoInput && photoPreview) {
    photoInput.onchange = () => {
      const file = photoInput.files?.[0];
      resetPhotoPreview();

      if (!file) {
        photoPreview.hidden = true;
        photoPreview.removeAttribute('src');
        return;
      }
      if (!file.type.startsWith('image/')) {
        photoInput.value = '';
        photoPreview.hidden = true;
        photoPreview.removeAttribute('src');
        setEditStatus('Selecciona un archivo de imagen válido.');
        return;
      }
      photoPreviewUrl = URL.createObjectURL(file);
      photoPreview.src = photoPreviewUrl;
      photoPreview.hidden = false;
      setEditStatus('');
      if (removePhoto) removePhoto.checked = false;
    };
  }
  if (removePhoto) {
    removePhoto.onchange = () => {
      if (removePhoto.checked && photoInput) photoInput.value = '';
      if (photoPreview) {
        photoPreview.hidden = removePhoto.checked || !state.currentUser.fotoPerfil;
        if (removePhoto.checked) photoPreview.removeAttribute('src');
        else if (state.currentUser.fotoPerfil) photoPreview.src = state.currentUser.fotoPerfil;
      }
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      photoPreviewUrl = null;
    };
  }
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      const saveButton = document.getElementById('btn-save-profile');
      const file = photoInput?.files?.[0];
      const formData = new FormData(editForm);
      const username = String(formData.get('username') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const changes = {
        username,
        email,
        quitarFoto: Boolean(removePhoto?.checked)
      };

      if (file) {
        try {
          changes.fotoPerfil = await compressProfilePhoto(file);
        } catch (error) {
          setEditStatus(error.message);
          return;
        }
      }

      if (saveButton) saveButton.disabled = true;
      setEditStatus('Guardando cambios...');
      try {
        const { usuario } = await apiRequest('/auth/perfil', {
          method: 'PATCH',
          body: JSON.stringify(changes)
        });
        state.setUserProfile({
          name: usuario.username,
          email: usuario.email,
          fotoPerfil: usuario.fotoPerfil || ''
        });
        renderProfileData();
        if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
        photoPreviewUrl = null;
        closeProfileEditor(editModal);
      } catch (error) {
        console.error('Error al guardar el perfil:', error);
        setEditStatus(error.message || 'No se pudo guardar el perfil.');
      } finally {
        if (saveButton) saveButton.disabled = false;
      }
    };
  }
}

function openProfileEditor(modal, photoPreview, removePhoto) {
  const form = document.getElementById('profile-edit-form');
  if (!form) return;
  const photoInput = document.getElementById('edit-profile-photo');
  document.getElementById('edit-profile-name').value = state.currentUser.name;
  document.getElementById('edit-profile-email').value = state.currentUser.email;
  if (photoInput) photoInput.value = '';
  if (removePhoto) removePhoto.checked = false;
  if (photoPreview) {
    photoPreview.hidden = !state.currentUser.fotoPerfil;
    if (state.currentUser.fotoPerfil) photoPreview.src = state.currentUser.fotoPerfil;
    else photoPreview.removeAttribute('src');
  }
  setEditStatus('');
  modal.classList.remove('hidden');
}

function closeProfileEditor(modal) {
  modal?.classList.add('hidden');
  const preview = document.getElementById('edit-profile-photo-preview');
  if (preview && !state.currentUser.fotoPerfil) {
    preview.hidden = true;
    preview.removeAttribute('src');
  }
}

function setEditStatus(message) {
  const status = document.getElementById('profile-edit-status');
  if (status) status.textContent = message;
}

async function compressProfilePhoto(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen debe pesar menos de 10 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('No se pudo procesar la foto.');
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.72, 0.55, 0.4]) {
    const fotoPerfil = canvas.toDataURL('image/jpeg', quality);
    if (fotoPerfil.length <= 85000) return fotoPerfil;
  }
  throw new Error('No se pudo comprimir la foto lo suficiente. Elige otra imagen.');
}

export async function renderProfile() {
  const requestId = ++profileRequestId;
  const userId = state.currentUser.id;
  const statusEl = document.getElementById('profile-status');
  if (statusEl) statusEl.textContent = 'Actualizando perfil...';

  try {
    const { usuario, items } = await apiRequest('/game/perfil');
    if (requestId !== profileRequestId || state.currentUser.id !== userId) return;

    state.setUserProfile({
      name: usuario.username,
      email: usuario.email,
      fotoPerfil: usuario.fotoPerfil || ''
    });
    state.setPoints(usuario.puntos);
    state.setInventory(items);
    if (statusEl) statusEl.textContent = '';
  } catch (error) {
    if (requestId !== profileRequestId || state.currentUser.id !== userId) return;
    console.error('Error al cargar los datos del perfil:', error);
    if (statusEl) statusEl.textContent = 'No se pudo actualizar el perfil. Intenta abrirlo de nuevo.';
  }

  renderProfileData();
}

function renderProfileData() {
  const nameEl = document.getElementById('profile-user-name');
  const emailEl = document.getElementById('profile-user-email');
  const avatarEl = document.getElementById('profile-avatar');
  const avatarFallbackEl = document.getElementById('profile-avatar-fallback');
  const itemsEl = document.getElementById('profile-items-count');
  const rareEl = document.getElementById('profile-rare-count');
  const legEl = document.getElementById('profile-legendary-count');
  const inventoryLabel = document.getElementById('profile-inventory-count');
  const inventoryGrid = document.querySelector('.inventory-grid');
  const inventory = state.currentUser.inventory;

  if (nameEl) nameEl.textContent = state.currentUser.name;
  if (emailEl) emailEl.textContent = state.currentUser.email;
  if (avatarEl && avatarFallbackEl) {
    avatarEl.hidden = !state.currentUser.fotoPerfil;
    avatarFallbackEl.hidden = Boolean(state.currentUser.fotoPerfil);
    avatarEl.onerror = () => {
      avatarEl.hidden = true;
      avatarFallbackEl.hidden = false;
    };
    if (state.currentUser.fotoPerfil) avatarEl.src = state.currentUser.fotoPerfil;
    else avatarEl.removeAttribute('src');
  }
  if (itemsEl) itemsEl.textContent = inventory.length;
  if (rareEl) rareEl.textContent = inventory.filter(item => item.rareza === 'raro').length;
  if (legEl) legEl.textContent = inventory.filter(item => item.rareza === 'legendario').length;
  if (inventoryLabel) inventoryLabel.textContent = `${inventory.length} OBJETOS`;

  if (inventoryGrid) {
    inventoryGrid.innerHTML = '';
    inventory.forEach(item => {
      const rarityType = ['raro', 'legendario'].includes(item.rareza) ? item.rareza : 'comun';
      const slot = document.createElement('div');
      slot.className = `slot filled ${rarityType}`;
      slot.title = `${item.nombre || item.equipo || 'Premio'} · ${rarityType}`;

      const rarity = document.createElement('span');
      rarity.className = 'slot-rarity';
      rarity.textContent = rarityType === 'legendario' ? 'L' : rarityType === 'raro' ? 'R' : 'C';

      if (item.modeloUrl) {
        const model = document.createElement('model-viewer');
        model.className = 'inventory-model';
        model.setAttribute('src', item.modeloUrl);
        model.setAttribute('alt', `Modelo 3D de ${item.nombre || item.equipo || 'premio'}`);
        model.setAttribute('auto-rotate', '');
        model.setAttribute('rotation-per-second', '30deg');
        model.setAttribute('camera-orbit', '0deg 75deg 105%');
        model.setAttribute('loading', 'lazy');
        model.setAttribute('interaction-prompt', 'none');
        model.setAttribute('disable-zoom', '');
        slot.appendChild(model);
      }

      const team = document.createElement('strong');
      team.className = 'inventory-prize-name';
      team.textContent = item.nombre || item.equipo || item.tag || 'Premio';

      const type = document.createElement('small');
      type.textContent = item.tipo || 'TARJETA';

      slot.append(rarity, team, type);
      inventoryGrid.appendChild(slot);
    });

    if (inventory.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'inventory-empty-message';
      emptyMessage.textContent = 'Aún no tienes premios. ¡Juega al gacha para obtener tu primera tarjeta!';
      inventoryGrid.appendChild(emptyMessage);
    } else {
      for (let index = inventory.length; index < 8; index++) {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'slot empty';
        inventoryGrid.appendChild(emptySlot);
      }
    }
  }

  state.syncPointsDisplay();
}
