import { teamsData } from '../data/teamsData.js';
import { state } from '../core/state.js';

let isSpinning = false;
let eventosAgregados = false; 

export function initARView(onOpenFullInfoCallback) {
  const btnClose = document.getElementById('btn-close-ar');
  const btnSpin = document.getElementById('btn-ar-spin');
  const btnConfetti = document.getElementById('btn-ar-confetti');
  const btnCapture = document.getElementById('btn-camera-capture');
  const btnMoreInfo = document.getElementById('btn-ar-more-info');

  if (btnClose) btnClose.onclick = () => closeARView();
  if (btnSpin) btnSpin.onclick = () => toggleModelSpin();
  if (btnConfetti) btnConfetti.onclick = () => triggerConfetti();
  if (btnCapture) btnCapture.onclick = () => takePhoto();
  if (btnMoreInfo) {
    btnMoreInfo.onclick = () => {
      closeARView();
      if (onOpenFullInfoCallback) {
        onOpenFullInfoCallback(state.currentSelectedTeamKey);
      }
    };
  }
}

export function takePhoto() { console.log("Tomando foto..."); }

export function openScannerView() {
  const detectedContent = document.getElementById('ar-detected-content');
  const modal = document.getElementById('ar-experience-modal');
  if (detectedContent) detectedContent.classList.remove('hidden');
  if (modal) modal.classList.remove('hidden');
  
  abrirEscenaAR(); 
}

export function openVRDirectly(teamKey) {
  state.setSelectedTeam(teamKey || 'alg');
  const team = teamsData[state.currentSelectedTeamKey];
  if (!team) return;

  const titleEl = document.getElementById('ar-team-title');
  const summaryEl = document.getElementById('ar-team-summary');
  const modal = document.getElementById('ar-experience-modal');

  if (titleEl) titleEl.textContent = team.name;
  if (summaryEl) summaryEl.textContent = `${team.city} · ${team.stadium}`;
  if (modal) modal.classList.remove('hidden');

  abrirEscenaAR();
}

export function closeARView() {
  const sceneEl = document.querySelector('a-scene');
  if (sceneEl && sceneEl.systems["mindar-image-system"]) {
    sceneEl.systems["mindar-image-system"].stop();
  }
  
  document.getElementById('ar-experience-modal')?.classList.add('hidden');
  isSpinning = false;
}

export function toggleModelSpin() {
  isSpinning = !isSpinning;
  const models = document.querySelectorAll('a-gltf-model');
  models.forEach(model => {
    if (isSpinning) {
      model.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 2000; easing: linear; loop: true');
    } else {
      model.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 4000; easing: linear; loop: true');
    }
  });
}

export function triggerConfetti() {
  if (typeof window.confetti === 'function') {
    window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }
}

function abrirEscenaAR() {
  const titleEl = document.getElementById('ar-team-title');
  const summaryEl = document.getElementById('ar-team-summary');

  if (titleEl) titleEl.textContent = 'Buscando marcador...';
  if (summaryEl) summaryEl.textContent = 'Apunta con la cámara al logo de un equipo.';

  const sceneEl = document.querySelector('a-scene');
  if (sceneEl && sceneEl.systems["mindar-image-system"]) {
    sceneEl.systems["mindar-image-system"].start();
  }

  if (eventosAgregados) return;

  // Solo usamos JavaScript para actualizar los textos, A-Frame dibuja los modelos
  const mapeoEquipos = {
    0: 'ace', 1: 'alg', 2: 'tec', 3: 'cal', 4: 'char',
    5: 'tor', 6: 'riel', 7: 'soc', 8: 'sul', 9: 'dor'
  };

  Object.keys(mapeoEquipos).forEach(index => {
    const targetEntity = document.querySelector(`#target-${index}`);
    if (targetEntity) {
      
     targetEntity.addEventListener('targetFound', () => {
        const teamKey = mapeoEquipos[index];
        const team = teamsData[teamKey];
        
        if (team) {
          state.setSelectedTeam(teamKey);
          if (titleEl) titleEl.textContent = team.name;
          if (summaryEl) summaryEl.textContent = `¡Capturado! ${team.city} · ${team.stadium}`;
        }
      });

      targetEntity.addEventListener('targetLost', () => {
        if (titleEl) titleEl.textContent = 'Buscando marcador...';
        if (summaryEl) summaryEl.textContent = 'Apunta con la cámara al logo de un equipo.';
      });
    }
  });

  eventosAgregados = true;
}