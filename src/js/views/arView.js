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

export function takePhoto() {  console.log("Tomando foto..."); }

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
        <!-- El id="" debe ser igual a lo que pusiste en mapeoEquipos (sin el #) -->
        <!-- El src="" debe ser exactamente igual al nombre de tu archivo .glb -->
        <a-asset-item id="acereroslogomodelo" src="./modelos/acereroslogomodelo.glb"></a-asset-item>
        <a-asset-item id="algodoneroslogo" src="./modelos/algodoneroslogo.glb"></a-asset-item>
        <a-asset-item id="tecos" src="./modelos/tecos.glb"></a-asset-item>
        <a-asset-item id="calienteslogo" src="./modelos/calienteslogo.glb"></a-asset-item>
        <a-asset-item id="charros" src="./modelos/charros.glb"></a-asset-item>
        <a-asset-item id="toroslogo" src="./modelos/toroslogo.glb"></a-asset-item>
        <a-asset-item id="rieleros" src="./modelos/rieleros.glb"></a-asset-item>
        
        <a-asset-item id="saraperos" src="./modelos/saraperos.glb"></a-asset-item>
        
        <a-asset-item id="sultanes" src="./modelos/sultanes.glb"></a-asset-item>
        <a-asset-item id="dorados" src="./modelos/dorados.glb"></a-asset-item>
      </a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false">
        <a-entity id="escaparate-persistente" position="0 -0.25 -3" visible="false">
          <a-gltf-model id="modelo-activo" rotation="0 0 0" scale="30.0 30.0 30.0" src="" animation="property: rotation; to: 0 360 0; dur: 4000; easing: linear; loop: true"></a-gltf-model>
        </a-entity>
      </a-camera>
      
      <!-- Detectores -->
      <a-entity id="target-0" mindar-image-target="targetIndex: 0"></a-entity>
      <a-entity id="target-1" mindar-image-target="targetIndex: 1"></a-entity>
    </a-scene>
  `;

   // Mapeo conectando el índice del .mind, la llave del equipo y el ID del modelo 3D
  const mapeoEquipos = {
    0: { key: 'ace', modelo: '#acereroslogomodelo' },
    1: { key: 'alg', modelo: '#algodoneroslogo' }, // Cambiar a '#modeloAlgodoneros' cuando lo tengas
    2: { key: 'tec', modelo: '#tecos' },
    3: { key: 'cal', modelo: '#calienteslogo' },
    4: { key: 'char', modelo: '#charros' },
    5: { key: 'tor', modelo: '#toroslogo' },
    6: { key: 'riel', modelo: '#rieleros' },
    7: { key: 'sar', modelo: '#saraperos' }, 
    8: { key: 'sul', modelo: '#sultanes' },
    9: { key: 'dor', modelo: '#dorados' }
  };

  // Variable para recordar qué equipo está actualmente en pantalla
  let equipoActual = null;

  setTimeout(() => {
    const escaparate = document.querySelector('#escaparate-persistente');
    const modeloActivo = document.querySelector('#modelo-activo');

    Object.keys(mapeoEquipos).forEach(index => {
      const targetEntity = document.querySelector(`#target-${index}`);
      if (targetEntity) {
        
        // CUANDO DETECTA LA IMAGEN
        targetEntity.addEventListener('targetFound', () => {
          const data = mapeoEquipos[index];
          equipoActual = data; // Guardamos en memoria el equipo actual
          const team = teamsData[data.key];
          
          if (team) {
            state.setSelectedTeam(data.key);
            if (titleEl) titleEl.textContent = team.name;
            if (summaryEl) summaryEl.textContent = `¡Capturado! ${team.city} · ${team.stadium}`;
          }

          if (modeloActivo) modeloActivo.setAttribute('src', data.modelo);
          if (escaparate) escaparate.setAttribute('visible', 'true');
        });
        
        // CUANDO PIERDE LA IMAGEN
        targetEntity.addEventListener('targetLost', () => {
          // Si el equipo escaneado es persistente, interrumpimos la función y no ocultamos nada
          if (equipoActual && equipoActual.persistente) {
            return; 
          }

          // Si NO es persistente, ocultamos el modelo y reiniciamos la UI
          if (escaparate) escaparate.setAttribute('visible', 'false');
          if (titleEl) titleEl.textContent = 'Buscando marcador...';
          if (summaryEl) summaryEl.textContent = 'Apunta con la cámara al logo de un equipo.';
        });

      }
    });
  }, 1000);
}