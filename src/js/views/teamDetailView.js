import { teamsData } from '../data/teamsData.js';
import { state } from '../core/state.js';

let currentGalleryList = [];
let currentIndex = 0;
let currentAppliedFilter = 'none';

export function initTeamDetailView(onBackCallback, onOpenARCallback, onGoToTriviaCallback) {
  const btnBack = document.getElementById('btn-back-home');
  const btnAR = document.getElementById('btn-team-ar');
  const btnTrivia = document.getElementById('btn-detail-to-trivia');
  const btnOpenEffects = document.getElementById('btn-open-effects');

  if (btnBack) btnBack.onclick = () => onBackCallback();
  if (btnAR) btnAR.onclick = () => onOpenARCallback(state.currentSelectedTeamKey);
  if (btnTrivia) btnTrivia.onclick = () => onGoToTriviaCallback();

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

  // Video local funcional para pruebas fluidas
  const workingVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
  
  currentGalleryList = [
    { type: 'video', src: workingVideoUrl },
    { type: 'image', src: team.image || team.mediaSrc || 'https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=800&q=80' }
  ];

  if (team.gallery && Array.isArray(team.gallery)) {
    team.gallery.forEach(item => {
      const isVid = typeof item === 'object' && item.type === 'video';
      currentGalleryList.push({
        type: isVid ? 'video' : 'image',
        src: isVid ? item.src : item
      });
    });
  }

  currentIndex = 0;
  updateMainBanner(currentIndex);

  const galleryContainer = document.getElementById('detail-stadium-gallery');
  if (galleryContainer) {
    galleryContainer.innerHTML = '';

    currentGalleryList.forEach((mediaItem, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-thumb-wrapper' + (idx === 0 ? ' selected' : '');
      
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
        wrapper.appendChild(imgElem);
      }

      wrapper.onclick = () => {
        currentIndex = idx;
        updateMainBanner(currentIndex);
        document.querySelectorAll('.gallery-thumb-wrapper').forEach(t => t.classList.remove('selected'));
        wrapper.classList.add('selected');
        openFullscreenModal(currentIndex);
      };

      galleryContainer.appendChild(wrapper);
    });
  }

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
    rosterContainer.innerHTML = '';
    team.roster.forEach(player => {
      const card = document.createElement('div');
      card.className = 'roster-card';
      card.innerHTML = `
        <img class="roster-player-img" src="${player.img}" alt="${player.name}">
        <div class="roster-info">
          <strong>${player.name}</strong>
          <small>${player.role}</small>
        </div>
      `;
      rosterContainer.appendChild(card);
    });
  }
}

function updateMainBanner(index) {
  const mainContainer = document.getElementById('media-banner-container');
  const media = currentGalleryList[index];
  if (!mainContainer || !media) return;

  const team = teamsData[state.currentSelectedTeamKey] || teamsData['alg'];

  if (media.type === 'video') {
    mainContainer.innerHTML = `
      <video src="${media.src}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>
      <div class="banner-overlay" style="pointer-events: none;">
        <span class="team-tag banner-tag ${team.tagClass || ''}">${team.tag}</span>
        <span class="banner-caption"><i class="fa-solid fa-video"></i> VISTA EN VIVO (VIDEO)</span>
      </div>
    `;
  } else {
    mainContainer.innerHTML = `
      <img id="detail-team-img" src="${media.src}" alt="Estadio" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1508801939243-2a0994f3823e?auto=format&fit=crop&w=800&q=80';">
      <div class="banner-overlay" style="pointer-events: none;">
        <span class="team-tag banner-tag ${team.tagClass || ''}">${team.tag}</span>
        <span class="banner-caption"><i class="fa-solid fa-camera"></i> VISTA EN VIVO</span>
      </div>
    `;
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