import { teamsData } from '../data/teamsData.js';
import { state } from '../core/state.js';

let isSpinning = false;

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

export function takePhoto() {
  // Se eliminó triggerConfetti(); para que no lance confeti al tomar foto
  console.log("Tomando foto..."); 
  // Aquí puedes agregar la lógica real para capturar la pantalla más adelante
}

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
  const container = document.getElementById('ar-3d-container');
  if (container) container.innerHTML = '';
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
      model.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 6000; easing: linear; loop: true');
    }
  });
}

export function triggerConfetti() {
  if (typeof window.confetti === 'function') {
    window.confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function abrirEscenaAR() {
  const container = document.getElementById('ar-3d-container');
  if (!container) return;

  const titleEl = document.getElementById('ar-team-title');
  const summaryEl = document.getElementById('ar-team-summary');

  if (titleEl) titleEl.textContent = 'Buscando marcador...';
  if (summaryEl) summaryEl.textContent = 'Apunta con la cámara al logo de un equipo.';

  container.innerHTML = `
    <a-scene embedded mindar-image="imageTargetSrc: ./targets/equipos-liga.mind; uiLoading: no; uiScanning: no;" color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false">
      <a-assets>
        <a-asset-item id="modeloAcereros" src="./modelos/acereroslogomodelo.glb"></a-asset-item>
      </a-assets>
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      
      <!-- Marcador 0: Acereros -->
      <a-entity id="target-0" mindar-image-target="targetIndex: 0">
        <a-gltf-model rotation="0 0 0" position="0 -0.25 0" scale="30.0 30.0 30.0" src="#modeloAcereros" animation="property: rotation; to: 0 360 0; dur: 4000; easing: linear; loop: true"></a-gltf-model>
      </a-entity>

      <!-- Marcador 1: Algodoneros -->
      <a-entity id="target-1" mindar-image-target="targetIndex: 1">
        <a-gltf-model rotation="0 0 0" position="0 -0.25 0" scale="30.0 30.0 30.0" src="#modeloAcereros" animation="property: rotation; to: 0 360 0; dur: 4000; easing: linear; loop: true"></a-gltf-model>
      </a-entity>
    </a-scene>
  `;

  const mapeoEquipos = {
    0: 'ace',
    1: 'alg'
  };

  setTimeout(() => {
    Object.keys(mapeoEquipos).forEach(index => {
      const targetEntity = document.querySelector(`#target-${index}`);
      if (targetEntity) {
        targetEntity.addEventListener('targetFound', () => {
          const teamKey = mapeoEquipos[index];
          const team = teamsData[teamKey];
          if (team) {
            state.setSelectedTeam(teamKey);
            if (titleEl) titleEl.textContent = team.name;
            if (summaryEl) summaryEl.textContent = `${team.city} · ${team.stadium}`;
          }
        });

        targetEntity.addEventListener('targetLost', () => {
          if (titleEl) titleEl.textContent = 'Buscando marcador...';
          if (summaryEl) summaryEl.textContent = 'Mantén el logo dentro del encuadre.';
        });
      }
    });
  }, 1000);
}