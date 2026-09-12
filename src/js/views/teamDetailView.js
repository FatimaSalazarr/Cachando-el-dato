import { teamsData } from '../data/teamsData.js';
import { state } from '../core/state.js';

export function initTeamDetailView(onBackCallback, onOpenARCallback, onGoToTriviaCallback) {
  const btnBack = document.getElementById('btn-back-home');
  const btnAR = document.getElementById('btn-team-ar');
  const btnTrivia = document.getElementById('btn-detail-to-trivia');

  if (btnBack) btnBack.onclick = () => onBackCallback();
  if (btnAR) btnAR.onclick = () => onOpenARCallback(state.currentSelectedTeamKey);
  if (btnTrivia) btnTrivia.onclick = () => onGoToTriviaCallback();
}

export function renderTeamDetail(teamKey) {
  state.setSelectedTeam(teamKey);
  const team = teamsData[teamKey] || teamsData['alg'];
  if (!team) return;

  const tagElem = document.getElementById('detail-team-tag');
  if (tagElem) {
    tagElem.textContent = team.tag;
    tagElem.className = `team-tag banner-tag ${team.tagClass}`;
  }

  const mainImg = document.getElementById('detail-team-img');
  if (mainImg) mainImg.src = team.image;

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

  // Galería
  const galleryContainer = document.getElementById('detail-stadium-gallery');
  if (galleryContainer) {
    galleryContainer.innerHTML = '';
    team.gallery.forEach((imgUrl, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-thumb-wrapper' + (idx === 0 ? ' selected' : '');
      const imgElem = document.createElement('img');
      imgElem.src = imgUrl;
      imgElem.className = 'gallery-thumb';

      wrapper.onclick = () => {
        if (mainImg) mainImg.src = imgUrl;
        document.querySelectorAll('.gallery-thumb-wrapper').forEach(t => t.classList.remove('selected'));
        wrapper.classList.add('selected');
      };

      wrapper.appendChild(imgElem);
      galleryContainer.appendChild(wrapper);
    });
  }

  // Roster
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
