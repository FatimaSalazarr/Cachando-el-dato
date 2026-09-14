import { teamsData } from '../data/teamsData.js';
import { state } from '../core/state.js';

let isSpinning = false;
let eventosAgregados = false; // Evita duplicar lógica al abrir la cámara varias veces

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
  // Detiene la cámara limpiamente en lugar de borrar el HTML
  if (sceneEl && sceneEl.systems["mindar-image-system"]) {
    sceneEl.systems["mindar-image-system"].stop();
  }
  
  document.getElementById('ar-experience-modal')?.classList.add('hidden');
  isSpinning = false;
}

export function toggleModelSpin() {
  isSpinning = !isSpinning;
  const modeloActivo = document.querySelector('#modelo-activo');
  if (modeloActivo) {
    if (isSpinning) {
      modeloActivo.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 2000; easing: linear; loop: true');
    } else {
      modeloActivo.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 4000; easing: linear; loop: true');
    }
  }
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
  // Enciende la cámara
  if (sceneEl && sceneEl.systems["mindar-image-system"]) {
    sceneEl.systems["mindar-image-system"].start();
  }

  // Si ya agregamos la lógica antes, no la repetimos
  if (eventosAgregados) return;

 const mapeoEquipos = {
    0: { key: 'ace', modelo: 'modelos/acereroslogomodelo.glb', persistente: true },
    1: { key: 'alg', modelo: 'modelos/algodoneroslogo.glb', persistente: true },
    2: { key: 'tec', modelo: 'modelos/tecos.glb', persistente: false },
    3: { key: 'cal', modelo: 'modelos/calienteslogo2.glb', persistente: false },
    4: { key: 'char', modelo: 'modelos/charros.glb', persistente: false },
    5: { key: 'tor', modelo: 'modelos/toroslogo.glb', persistente: false },
    6: { key: 'riel', modelo: 'modelos/rieleros.glb', persistente: false },
    7: { key: 'soc', modelo: 'modelos/saraperos.glb', persistente: false }, 
    8: { key: 'sul', modelo: 'modelos/sultanes.glb', persistente: false },
    9: { key: 'dor', modelo: 'modelos/dorados.glb', persistente: false }
  };

  let equipoActual = null;
  const escaparate = document.querySelector('#escaparate-persistente');
  const modeloActivo = document.querySelector('#modelo-activo');

  Object.keys(mapeoEquipos).forEach(index => {
    const targetEntity = document.querySelector(`#target-${index}`);
    if (targetEntity) {
      
      targetEntity.addEventListener('targetFound', () => {
        const data = mapeoEquipos[index];
        equipoActual = data; 
        const team = teamsData[data.key];
        
        if (team) {
          state.setSelectedTeam(data.key);
          if (titleEl) titleEl.textContent = team.name;
          if (summaryEl) summaryEl.textContent = `¡Capturado! ${team.city} · ${team.stadium}`;
        }

        if (modeloActivo) {
          modeloActivo.setAttribute('gltf-model', data.modelo);
        }
        if (escaparate) escaparate.setAttribute('visible', 'true');
      });
      
      targetEntity.addEventListener('targetLost', () => {
        if (equipoActual && equipoActual.persistente) return; 

        if (escaparate) escaparate.setAttribute('visible', 'false');
        if (titleEl) titleEl.textContent = 'Buscando marcador...';
        if (summaryEl) summaryEl.textContent = 'Apunta con la cámara al logo de un equipo.';
      });
    }
  });

  eventosAgregados = true;
}