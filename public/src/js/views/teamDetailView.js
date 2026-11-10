import { teamsData } from '../data/teamsData.js';
import { state } from '../core/state.js';
import { apiRequest } from '../core/api.js';

let currentGalleryList = [];
let localGalleryItems = [];
let stadiumGalleryList = [];
let remoteGalleryItems = [];
let currentIndex = 0;
let galleryLoadId = 0;
let currentAppliedFilter = 'none';

export function initTeamDetailView(onBackCallback, onOpenARCallback, onGoToTriviaCallback) {
  const btnBack = document.getElementById('btn-back-home');
  const btnAR = document.getElementById('btn-team-ar');
  const btnTrivia = document.getElementById('btn-detail-to-trivia');
  const btnOpenEffects = document.getElementById('btn-open-effects');
  const btnRefreshFeed = document.getElementById('btn-refresh-team-feed');
  const btnUploadGallery = document.getElementById('btn-team-gallery-upload');
  const galleryFileInput = document.getElementById('team-gallery-file');

  if (btnBack) btnBack.onclick = () => onBackCallback();
  if (btnAR) btnAR.onclick = () => onOpenARCallback(state.currentSelectedTeamKey);
  if (btnTrivia) btnTrivia.onclick = () => onGoToTriviaCallback();
  if (btnRefreshFeed) {
    btnRefreshFeed.onclick = () => renderTeamFanFeed(state.currentSelectedTeamKey);
  }
  if (btnUploadGallery && galleryFileInput) {
    btnUploadGallery.onclick = () => {
      if (!state.currentUser.token) {
        const status = document.getElementById('team-gallery-status');
        if (status) status.textContent = 'Inicia sesión para subir una foto o video a la galería.';
        return;
      }
      galleryFileInput.click();
    };
  }
  if (galleryFileInput) {
    galleryFileInput.onchange = () => uploadTeamGalleryMedia(galleryFileInput);
  }

  if (btnOpenEffects) {
    btnOpenEffects.onclick = () => {
      if (currentGalleryList.length > 0) {
        openFullscreenModal(currentIndex);
      }
    };
  }

  setupFullscreenModalEvents();
}

export function renderTeamDetail(teamKey) {
  state.setSelectedTeam(teamKey);
  const team = teamsData[teamKey] || teamsData['alg'];
  if (!team) return;

  const tagElem = document.getElementById('detail-team-tag');
  if (tagElem) {
    tagElem.textContent = team.tag;
    tagElem.className = `team-tag banner-tag ${team.tagClass || ''}`;
  }

  currentGalleryList = [];

  if (team.image || team.mediaSrc) {
    const imageSrc = team.image || team.mediaSrc;
    currentGalleryList.push({ type: 'image', src: imageSrc });
  }

  if (team.gallery && Array.isArray(team.gallery)) {
    team.gallery.forEach(item => {
      const isVid = typeof item === 'object' && item.type === 'video';
      const src = isVid ? item.src : item;
      if (typeof src !== 'string' || !src.trim()) return;
      currentGalleryList.push({
        type: isVid ? 'video' : 'image',
        src
      });
    });
  }

  currentIndex = 0;
  localGalleryItems = [...currentGalleryList];
  stadiumGalleryList = [...localGalleryItems];
  remoteGalleryItems = [];
  if (currentGalleryList.length) {
    updateMainBanner(currentIndex);
  } else {
    renderBannerPlaceholder(team);
  }

  renderStadiumGallery();

  renderTeamFanFeed(teamKey);
  loadTeamGallery(teamKey);

  const setTxt = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setTxt('detail-team-name', team.name);
  setTxt('detail-team-city', team.city);
  setTxt('detail-team-stadium', team.stadium);
  setTxt('detail-team-capacity', team.capacity);
  setTxt('detail-team-titles', team.titles);
  setTxt('detail-team-founded', team.founded);
  setTxt('detail-team-nickname', team.nickname);
  setTxt('detail-team-manager', team.manager);
  setTxt('detail-team-desc', team.desc);

  const rosterContainer = document.getElementById('detail-team-roster');
  if (rosterContainer) {
    rosterContainer.replaceChildren();
    (team.roster || []).forEach((player) => {
      const card = document.createElement('div');
      card.className = 'roster-card';
      const avatar = document.createElement('div');
      avatar.className = 'roster-player-avatar';
      if (player.img) {
        const image = document.createElement('img');
        image.className = 'roster-player-img';
        image.src = player.img;
        image.alt = '';
        image.loading = 'lazy';
        image.addEventListener('error', () => {
          image.remove();
          avatar.textContent = player.name.slice(0, 1).toUpperCase();
        }, { once: true });
        avatar.append(image);
      } else {
        avatar.textContent = player.name.slice(0, 1).toUpperCase();
      }

      const details = document.createElement('div');
      details.className = 'roster-info';
      const playerName = document.createElement('strong');
      playerName.textContent = player.name;
      const role = document.createElement('small');
      role.textContent = player.role;
      details.append(playerName, role);
      card.append(avatar, details);
      rosterContainer.append(card);
    });

    if (!team.roster?.length) {
      const empty = document.createElement('p');
      empty.className = 'roster-empty';
      empty.textContent = 'Pronto agregaremos los jugadores destacados de este equipo.';
      rosterContainer.append(empty);
    }
  }
}

function renderStadiumGallery() {
  const galleryContainer = document.getElementById('detail-stadium-gallery');
  if (!galleryContainer) return;
  galleryContainer.replaceChildren();

  stadiumGalleryList.forEach((mediaItem) => {
    const mediaIndex = currentGalleryList.indexOf(mediaItem);
    if (mediaIndex < 0) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-thumb-wrapper' + (mediaIndex === currentIndex ? ' selected' : '');

    if (mediaItem.type === 'video') {
      const videoElem = document.createElement('video');
      videoElem.src = mediaItem.src;
      videoElem.className = 'gallery-video-thumb';
      videoElem.muted = true;
      wrapper.appendChild(videoElem);
    } else {
      const imgElem = document.createElement('img');
      imgElem.src = mediaItem.src;
      imgElem.className = 'gallery-thumb';
      imgElem.alt = 'Foto de la galería del estadio';
      imgElem.loading = 'lazy';
      wrapper.appendChild(imgElem);
    }
    if (mediaItem.caption) {
      const caption = document.createElement('span');
      caption.className = 'gallery-thumb-caption';
      caption.textContent = mediaItem.caption;
      wrapper.appendChild(caption);
    }

    wrapper.onclick = () => {
      currentIndex = mediaIndex;
      updateMainBanner(currentIndex);
      document.querySelectorAll('.gallery-thumb-wrapper').forEach((thumb) => thumb.classList.remove('selected'));
      wrapper.classList.add('selected');
      openFullscreenModal(currentIndex);
    };
    galleryContainer.appendChild(wrapper);
  });

  if (stadiumGalleryList.length === 0) {
    const emptyGallery = document.createElement('p');
    emptyGallery.className = 'team-feed-empty';
    emptyGallery.textContent = 'Aún no hay imágenes de la galería del estadio.';
    galleryContainer.appendChild(emptyGallery);
  }
}

async function loadTeamGallery(teamKey) {
  const status = document.getElementById('team-gallery-status');
  const loadId = ++galleryLoadId;
  try {
    const { publicaciones } = await apiRequest(`/game/team-gallery/${encodeURIComponent(teamKey)}`);
    if (state.currentSelectedTeamKey !== teamKey || loadId !== galleryLoadId) return false;
    remoteGalleryItems.forEach((item) => {
      const oldIndex = currentGalleryList.indexOf(item);
      if (oldIndex >= 0) currentGalleryList.splice(oldIndex, 1);
    });
    remoteGalleryItems = [];
    (Array.isArray(publicaciones) ? publicaciones : []).forEach((post) => {
      const media = {
        type: post.type === 'video' ? 'video' : 'image',
        src: post.mediaUrl,
        caption: post.caption || ''
      };
      remoteGalleryItems.push(media);
      currentGalleryList.push(media);
    });
    stadiumGalleryList = [...localGalleryItems, ...remoteGalleryItems];
    renderStadiumGallery();
    if (status) status.textContent = '';
    return true;
  } catch (error) {
    if (state.currentSelectedTeamKey !== teamKey || loadId !== galleryLoadId) return false;
    console.error('Error al cargar la galería del equipo:', error);
    if (status) {
      status.textContent = error.status === 401
        ? 'Inicia sesión para ver y subir fotos a la galería.'
        : 'No se pudo cargar la galería. Intenta actualizar la vista.';
    }
    return false;
  }
}

function updateMainBanner(index) {
  const mainContainer = document.getElementById('media-banner-container');
  const media = currentGalleryList[index];
  if (!mainContainer || !media) return;

  const team = teamsData[state.currentSelectedTeamKey] || teamsData['alg'];
  const mediaElement = document.createElement(media.type === 'video' ? 'video' : 'img');
  mediaElement.className = 'team-banner-media';
  mediaElement.src = media.src;
  if (media.type === 'video') {
    mediaElement.autoplay = true;
    mediaElement.muted = true;
    mediaElement.loop = true;
    mediaElement.playsInline = true;
  } else {
    mediaElement.alt = `Galería de ${team.name}`;
  }
  mainContainer.replaceChildren(
    mediaElement,
    createBannerOverlay(team, media.type === 'video' ? 'VIDEO DE LA AFICIÓN' : 'GALERÍA DEL EQUIPO', true)
  );
}

function renderBannerPlaceholder(team) {
  const banner = document.getElementById('media-banner-container');
  if (!banner) return;

  const placeholder = document.createElement('div');
  placeholder.className = 'team-banner-placeholder';
  const logo = document.createElement('img');
  logo.className = 'team-banner-logo';
  logo.src = team.logo;
  logo.alt = `${team.name} logo`;
  logo.addEventListener('error', () => {
    logo.remove();
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-baseball';
    placeholder.prepend(icon);
  }, { once: true });

  const name = document.createElement('span');
  name.className = 'team-banner-name';
  name.textContent = team.name;
  const caption = document.createElement('small');
  caption.textContent = team.nickname;
  placeholder.append(logo, name, caption);

  banner.replaceChildren(placeholder, createBannerOverlay(team, 'ORGULLO DE LA AFICIÓN'));
}

function createBannerOverlay(team, captionText, showLogo = false) {
  const overlay = document.createElement('div');
  overlay.className = 'banner-overlay';
  overlay.style.pointerEvents = 'none';

  const identity = document.createElement('div');
  identity.className = 'team-banner-identity';
  if (showLogo && team.logo) {
    const logo = document.createElement('img');
    logo.className = 'team-banner-overlay-logo';
    logo.src = team.logo;
    logo.alt = '';
    identity.append(logo);
  }

  const tag = document.createElement('span');
  tag.className = `team-tag banner-tag ${team.tagClass || ''}`;
  tag.textContent = team.tag;
  identity.append(tag);

  const caption = document.createElement('span');
  caption.className = 'banner-caption';
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-camera';
  caption.append(icon, document.createTextNode(` ${captionText}`));

  overlay.append(identity, caption);
  return overlay;
}

async function renderTeamFanFeed(teamKey) {
  const grid = document.getElementById('team-fan-feed-grid');
  const status = document.getElementById('team-feed-status');
  if (!grid) return;

  grid.replaceChildren();
  if (status) status.textContent = 'Cargando publicaciones...';
  const refreshButton = document.getElementById('btn-refresh-team-feed');
  if (refreshButton) refreshButton.disabled = true;
  try {
    const { publicaciones } = await apiRequest(`/game/team-feed/${encodeURIComponent(teamKey)}`);
    if (state.currentSelectedTeamKey !== teamKey) return;
    if (status) status.textContent = '';

    if (!Array.isArray(publicaciones) || publicaciones.length === 0) {
      renderFeedEmpty(grid, 'Sé el primero en compartir una foto o video de este equipo.');
      return;
    }

    publicaciones.forEach((post) => {
      const media = {
        type: post.type === 'video' ? 'video' : 'image',
        src: post.mediaUrl
      };
      const mediaIndex = currentGalleryList.push(media) - 1;
      const card = document.createElement('article');
      card.className = 'team-feed-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Abrir publicación de ${post.username || 'aficionado'}`);
      const mediaElement = post.type === 'video'
        ? document.createElement('video')
        : document.createElement('img');
      mediaElement.className = 'team-feed-media';
      mediaElement.src = post.mediaUrl;
      if (post.type === 'video') {
        mediaElement.muted = true;
        mediaElement.playsInline = true;
        mediaElement.preload = 'metadata';
        mediaElement.setAttribute('aria-label', `Video de ${post.username || 'aficionado'}`);
      } else {
        mediaElement.alt = `Foto compartida por ${post.username || 'un aficionado'} de ${teamsData[teamKey]?.name || 'el equipo'}`;
        mediaElement.loading = 'lazy';
      }
      mediaElement.addEventListener('error', () => {
        mediaElement.classList.add('team-feed-media-error');
      }, { once: true });

      const openMedia = () => openFullscreenModal(mediaIndex);
      card.appendChild(mediaElement);

      if (post.caption) {
        const caption = document.createElement('p');
        caption.className = 'team-feed-caption';
        caption.textContent = post.caption;
        card.appendChild(caption);
      }

      const meta = document.createElement('div');
      meta.className = 'team-feed-meta';
      const author = document.createElement('strong');
      author.textContent = post.username || 'Aficionado';
      const date = document.createElement('time');
      const createdAt = new Date(post.createdAt);
      date.dateTime = Number.isNaN(createdAt.getTime()) ? '' : createdAt.toISOString();
      date.textContent = Number.isNaN(createdAt.getTime())
        ? 'Reciente'
        : createdAt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      meta.append(author, date);
      card.appendChild(meta);
      card.addEventListener('click', openMedia);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openMedia();
        }
      });
      grid.appendChild(card);
    });
  } catch (error) {
    if (state.currentSelectedTeamKey !== teamKey) return;
    console.error('Error al cargar las publicaciones del equipo:', error);
    if (status) {
      status.textContent = error.status === 401
        ? 'Inicia sesión para ver y compartir publicaciones de la afición.'
        : 'No se pudo cargar el feed. Intenta actualizarlo.';
    }
    renderFeedEmpty(
      grid,
      error.status === 401
        ? 'Las fotos de la comunidad aparecerán aquí cuando inicies sesión.'
        : 'Tus fotos y las de la afición aparecerán aquí.',
      error.status === 401 ? null : () => renderTeamFanFeed(teamKey)
    );
  } finally {
    if (refreshButton) refreshButton.disabled = false;
  }
}

function renderFeedEmpty(grid, message, retry) {
  const empty = document.createElement('div');
  empty.className = 'team-feed-empty';
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-camera-retro';
  const text = document.createElement('span');
  text.textContent = message;
  empty.append(icon, text);
  if (retry) {
    const button = document.createElement('button');
    button.className = 'team-feed-retry';
    button.type = 'button';
    button.textContent = 'REINTENTAR';
    button.addEventListener('click', retry);
    empty.append(button);
  }
  grid.appendChild(empty);
}

async function uploadTeamGalleryMedia(fileInput) {
  const file = fileInput.files?.[0];
  if (!file) return;

  const status = document.getElementById('team-gallery-status');
  const captionInput = document.getElementById('team-gallery-caption-input');
  const uploadButton = document.getElementById('btn-team-gallery-upload');
  const teamKey = state.currentSelectedTeamKey;
  const allowedTypes = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'
  ]);

  if (!state.currentUser.token) {
    if (status) status.textContent = 'Inicia sesión para subir una foto o video a la galería.';
    fileInput.value = '';
    return;
  }
  if (!allowedTypes.has(file.type)) {
    if (status) status.textContent = 'Elige una imagen JPG, PNG o WebP, o un video MP4 o WebM.';
    fileInput.value = '';
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    if (status) status.textContent = 'El archivo no puede superar los 20 MB.';
    fileInput.value = '';
    return;
  }

  fileInput.disabled = true;
  if (uploadButton) uploadButton.disabled = true;
  if (status) status.textContent = 'Subiendo a la galería…';

  try {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('caption', captionInput?.value.trim() || '');

    await apiRequest(`/game/team-gallery/${encodeURIComponent(teamKey)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.currentUser.token}` },
      body: formData
    });
    fileInput.value = '';
    if (captionInput) captionInput.value = '';
    const galleryLoaded = await loadTeamGallery(teamKey);
    if (state.currentSelectedTeamKey !== teamKey) return;
    if (status) {
      status.textContent = galleryLoaded
        ? '¡Tu archivo ya está en la galería del estadio!'
        : 'Archivo subido, pero no se pudo actualizar la galería.';
    }
  } catch (error) {
    console.error('Error al subir un archivo a la galería del equipo:', error);
    if (state.currentSelectedTeamKey !== teamKey) return;
    if (status) {
      status.textContent = error.status === 401
        ? 'Tu sesión venció. Inicia sesión de nuevo para subir archivos.'
        : error.message || 'No se pudo subir el archivo.';
    }
  } finally {
    fileInput.disabled = false;
    if (uploadButton) uploadButton.disabled = false;
  }
}

function openFullscreenModal(index) {
  currentIndex = index;
  const modal = document.getElementById('media-fullscreen-modal');
  const container = document.getElementById('mfm-media-container');
  if (!modal || !container) return;

  currentAppliedFilter = 'none';
  updateActiveFilterUI();
  removeSparkleParticles();

  renderModalMedia();
  modal.style.display = 'flex';
}

function renderModalMedia() {
  const container = document.getElementById('mfm-media-container');
  const media = currentGalleryList[currentIndex];
  if (!container || !media) return;

  removeSparkleParticles();

  if (media.type === 'video') {
    container.innerHTML = `<video id="mfm-target-media" src="${media.src}" controls autoplay loop playsinline></video>`;
  } else {
    container.innerHTML = `<img id="mfm-target-media" src="${media.src}" alt="Media Ampliada">`;
  }
  applyFilterToModalMedia(currentAppliedFilter);
}

function setupFullscreenModalEvents() {
  const modal = document.getElementById('media-fullscreen-modal');
  const closeBtn = document.getElementById('mfm-close-btn');
  const saveBtn = document.getElementById('mfm-save-btn');
  const prevBtn = document.getElementById('mfm-prev-btn');
  const nextBtn = document.getElementById('mfm-next-btn');
  const filterButtons = document.querySelectorAll('.mfm-filter-circle');
  
  const successModal = document.getElementById('success-alert-modal');
  const successOkBtn = document.getElementById('success-modal-ok-btn');

  if (closeBtn && modal) {
    closeBtn.onclick = () => { modal.style.display = 'none'; };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };
  }

  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + currentGalleryList.length) % currentGalleryList.length;
      renderModalMedia();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex + 1) % currentGalleryList.length;
      renderModalMedia();
    };
  }

  filterButtons.forEach(btn => {
    btn.onclick = () => {
      currentAppliedFilter = btn.getAttribute('data-filter');
      updateActiveFilterUI();
      applyFilterToModalMedia(currentAppliedFilter);
    };
  });

  if (saveBtn) {
    saveBtn.onclick = () => {
      modal.style.display = 'none';
      if (successModal) {
        successModal.style.display = 'flex';
      }
    };
  }

  if (successOkBtn && successModal) {
    successOkBtn.onclick = () => {
      successModal.style.display = 'none';
    };
  }

  if (successModal) {
    successModal.onclick = (e) => {
      if (e.target === successModal) successModal.style.display = 'none';
    };
  }
}

function updateActiveFilterUI() {
  document.querySelectorAll('.mfm-filter-circle').forEach(btn => {
    if (btn.getAttribute('data-filter') === currentAppliedFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function removeSparkleParticles() {
  const containerElem = document.getElementById('mfm-media-container');
  if (!containerElem) return;
  containerElem.querySelectorAll('.sparkle-svg-particle').forEach(el => el.remove());
}

function applyFilterToModalMedia(filterName) {
  const mediaElem = document.getElementById('mfm-target-media');
  const containerElem = document.getElementById('mfm-media-container');
  if (!mediaElem || !containerElem) return;

  mediaElem.className = '';
  removeSparkleParticles();

  if (filterName === 'sparkles') {
    // Generamos destellos vectoriales de estrellas SVG distribuidos aleatoriamente por toda el área
    for (let i = 0; i < 10; i++) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'sparkle-svg-particle');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.innerHTML = '<path d="M12 0l3.09 8.26L24 12l-8.91 3.74L12 24l-3.09-8.26L0 12l8.91-3.74z"/>';
      
      svg.style.top = `${Math.random() * 85 + 5}%`;
      svg.style.left = `${Math.random() * 90 + 5}%`;
      svg.style.animationDelay = `${Math.random() * 1.5}s`;
      
      const size = Math.floor(Math.random() * 8 + 12);
      svg.style.width = `${size}px`;
      svg.style.height = `${size}px`;

      containerElem.appendChild(svg);
    }
  } else if (filterName !== 'none') {
    mediaElem.classList.add(`filter-${filterName}`);
  }
}