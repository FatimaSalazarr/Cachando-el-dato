import { teamsData } from '../data/teamsData.js';
import { state } from '../core/state.js';
import { apiRequest } from '../core/api.js';


let isSpinning = false;
let eventosAgregados = false; 
let detectedTeamKey = null;
let openTeamDetailCallback = null;
let recordingSession = null;
let activeFilter = 'none';
let modelEventsAdded = false;
let capturePressTimer = null;
let captureGestureRecording = false;
let isCapturingPhoto = false;
let isUploadingCapture = false;

const CAPTURE_FILTERS = {
  none: 'none',
  blur: 'blur(3px)',
  thermal: 'hue-rotate(180deg) saturate(2.2) invert(0.12)',
  saturate: 'saturate(2.5)',
  sparkles: 'brightness(1.12) saturate(1.3)'
};

export function initARView(onOpenFullInfoCallback) {
  openTeamDetailCallback = onOpenFullInfoCallback;
  const btnClose = document.getElementById('btn-close-ar');
  const btnSpin = document.getElementById('btn-ar-spin');
  const btnConfetti = document.getElementById('btn-ar-confetti');
  const btnCapture = document.getElementById('btn-camera-capture');
  const btnMoreInfo = document.getElementById('btn-ar-more-info');

  // Referencias para el modal de ayuda nuevo
  const btnHelp = document.getElementById('btn-ar-help');
  const arHelpModal = document.getElementById('ar-help-modal');
  const btnCloseArModal = document.getElementById('btn-close-ar-modal');
  const btnArGotIt = document.getElementById('btn-ar-got-it');

  if (btnClose) btnClose.onclick = () => closeARView();
  if (btnSpin) btnSpin.onclick = () => toggleModelSpin();
  if (btnConfetti) btnConfetti.onclick = () => triggerConfetti();
  if (btnCapture) {
    btnCapture.onpointerdown = (event) => {
      if (btnCapture.disabled) return;
      event.preventDefault();
      if (typeof btnCapture.setPointerCapture === 'function') {
        btnCapture.setPointerCapture(event.pointerId);
      }
      captureGestureRecording = false;
      capturePressTimer = window.setTimeout(() => {
        captureGestureRecording = true;
        startVideoRecording();
      }, 280);
    };
    btnCapture.onpointerup = (event) => {
      event.preventDefault();
      if (capturePressTimer) window.clearTimeout(capturePressTimer);
      capturePressTimer = null;
      if (recordingSession) {
        stopVideoRecording();
      } else if (!captureGestureRecording) {
        takePhoto();
      }
      captureGestureRecording = false;
    };
    btnCapture.onpointercancel = () => {
      if (capturePressTimer) window.clearTimeout(capturePressTimer);
      capturePressTimer = null;
      captureGestureRecording = true;
      if (recordingSession) stopVideoRecording();
    };
    btnCapture.onclick = (event) => {
      if (event.detail === 0 && !btnCapture.disabled) takePhoto();
    };
  }
  document.querySelectorAll('.ar-live-filter').forEach((button) => {
    button.onclick = () => selectCaptureFilter(button.dataset.filter || 'none');
  });
  if (btnMoreInfo) {
    btnMoreInfo.onclick = () => {
      closeARView();
      if (onOpenFullInfoCallback) {
        onOpenFullInfoCallback(state.currentSelectedTeamKey);
      }
    };
  }

  // Eventos del Modal de Ayuda agregado
  if (btnHelp && arHelpModal) {
    btnHelp.onclick = () => {
      arHelpModal.style.display = 'flex';
    };
  }
  if (btnCloseArModal && arHelpModal) {
    btnCloseArModal.onclick = () => {
      arHelpModal.style.display = 'none';
    };
  }
  if (btnArGotIt && arHelpModal) {
    btnArGotIt.onclick = () => {
      arHelpModal.style.display = 'none';
    };
  }
  if (arHelpModal) {
    arHelpModal.onclick = (e) => {
      if (e.target === arHelpModal) {
        arHelpModal.style.display = 'none';
      }
    };
  }
}

export async function takePhoto() {
  if (!detectedTeamKey) {
    setCaptureStatus('Primero apunta al logo de un equipo.');
    return;
  }
  if (isUploadingCapture || isCapturingPhoto) return;
  const teamKey = detectedTeamKey;
  const filter = activeFilter;
  isCapturingPhoto = true;
  updateCaptureButtons();
  try {
    const video = getCameraVideo();
    const canvas = makeCaptureCanvas(video);
    const context = canvas.getContext('2d');
    drawARFrame(context, canvas, video);
    const photo = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo procesar la foto.')), 'image/jpeg', 0.9);
    });
    await publishCapture(photo, 'image', teamKey, filter);
  } catch (error) {
    console.error('Error al tomar la foto:', error);
    setCaptureStatus(error.message || 'No se pudo tomar la foto.');
  } finally {
    isCapturingPhoto = false;
    updateCaptureButtons();
  }
}

async function startVideoRecording() {
  if (!detectedTeamKey || isUploadingCapture || isCapturingPhoto || recordingSession) {
    setCaptureStatus('Primero apunta al logo de un equipo.');
    return;
  }

  let stream;
  try {
    if (typeof window.MediaRecorder !== 'function') {
      throw new Error('Este dispositivo no permite grabar video desde el escáner.');
    }
    const video = getCameraVideo();
    const canvas = makeCaptureCanvas(video);
    stream = canvas.captureStream(24);
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/mp4']
      .find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 1800000 } : undefined);
    const chunks = [];
    const session = {
      recorder,
      stream,
      canvas,
      video,
      teamKey: detectedTeamKey,
      filter: activeFilter,
      chunks,
      frameId: 0,
      timeoutId: 0,
      discard: false
    };
    recordingSession = session;
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = (event) => {
      console.error('Error al grabar video:', event.error);
      setCaptureStatus('No se pudo grabar el video.');
      stopVideoRecording();
    };
    recorder.onstop = () => finishVideoRecording(session);

    recorder.start(500);
    const draw = () => {
      if (recordingSession !== session || recorder.state !== 'recording') return;
      drawARFrame(canvas.getContext('2d'), canvas, video, session.filter);
      session.frameId = requestAnimationFrame(draw);
    };
    draw();
    session.timeoutId = window.setTimeout(stopVideoRecording, 15000);
    updateCaptureButtons();
    setCaptureStatus('Grabando video… suelta para publicar (máximo 15 segundos).');
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    console.error('Error al iniciar la grabación:', error);
    setCaptureStatus(error.message || 'Este dispositivo no permite grabar video desde el escáner.');
  }
}

function stopVideoRecording() {
  const session = recordingSession;
  if (!session) return;
  if (session.timeoutId) window.clearTimeout(session.timeoutId);
  if (session.frameId) cancelAnimationFrame(session.frameId);
  if (session.recorder.state !== 'inactive') session.recorder.stop();
}

function finishVideoRecording(session) {
  if (session.frameId) cancelAnimationFrame(session.frameId);
  if (session.timeoutId) window.clearTimeout(session.timeoutId);
  session.stream.getTracks().forEach((track) => track.stop());
  if (recordingSession === session) recordingSession = null;
  updateCaptureButtons();

  const blob = new Blob(session.chunks, { type: session.recorder.mimeType || 'video/webm' });
  if (session.discard || blob.size === 0) {
    setCaptureStatus('No se guardó ningún video.');
    return;
  }
  setCaptureStatus('Subiendo video…');
  publishCapture(blob, 'video', session.teamKey, session.filter);
}

function makeCaptureCanvas(video) {
  const maxDimension = 1280;
  const width = video.videoWidth || video.clientWidth;
  const height = video.videoHeight || video.clientHeight;
  if (!width || !height) throw new Error('La cámara todavía no está lista. Intenta de nuevo.');
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  return canvas;
}

function getCameraVideo() {
  const scene = document.querySelector('a-scene');
  const arVideo = scene?.systems?.['mindar-image-system']?.video;
  const video = arVideo
    || document.querySelector('#ar-3d-container video')
    || Array.from(document.querySelectorAll('video')).find((candidate) => candidate.srcObject);
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    throw new Error('No se encontró la vista de la cámara. Revisa el permiso de cámara e intenta de nuevo.');
  }
  return video;
}

function drawARFrame(context, canvas, video, filter = 'none') {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.filter = CAPTURE_FILTERS[filter];
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const sceneCanvas = document.querySelector('a-scene canvas');
  if (sceneCanvas?.width && sceneCanvas?.height) {
    context.drawImage(sceneCanvas, 0, 0, canvas.width, canvas.height);
  }
  context.filter = 'none';
  if (filter === 'sparkles') drawSparkles(context, canvas.width, canvas.height);
}

function selectCaptureFilter(filter) {
  if (!Object.hasOwn(CAPTURE_FILTERS, filter)) return;
  activeFilter = filter;
  document.querySelectorAll('.ar-live-filter').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === filter);
  });

  const scanner = document.getElementById('ar-3d-container');
  if (scanner) {
    scanner.classList.remove('capture-filter-blur', 'capture-filter-thermal', 'capture-filter-saturate', 'capture-filter-sparkles');
    if (filter !== 'none') scanner.classList.add(`capture-filter-${filter}`);
  }
}

async function publishCapture(blob, type, teamKey, filter) {
  isUploadingCapture = true;
  updateCaptureButtons();
  setCaptureStatus(type === 'image' ? 'Preparando y publicando tu foto…' : 'Publicando tu video…');

  try {
    const filteredBlob = type === 'image' ? await createFilteredPhoto(blob, filter) : blob;
    if (filteredBlob.size > 20 * 1024 * 1024) {
      throw new Error('El archivo supera los 20 MB. Graba un video más corto.');
    }

    const formData = new FormData();
    const mimeType = getUploadMimeType(filteredBlob.type);
    const uploadBlob = new Blob([filteredBlob], { type: mimeType });
    formData.append('media', uploadBlob, makeUploadFilename(mimeType));
    formData.append('filter', filter);
    formData.append('caption', '');

    await apiRequest(`/game/team-feed/${encodeURIComponent(teamKey)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.currentUser.token}` },
      body: formData
    });
    setCaptureStatus(type === 'image'
      ? '¡Foto publicada en Momentos de la afición!'
      : '¡Video publicado en Momentos de la afición!');
  } catch (error) {
    console.error('Error al publicar la captura:', error);
    setCaptureStatus(error.status === 401
      ? 'Inicia sesión para publicar capturas en Momentos de la afición.'
      : error.message || 'No se pudo subir el archivo.');
  } finally {
    isUploadingCapture = false;
    updateCaptureButtons();
  }
}

async function createFilteredPhoto(blob, filter) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('No se pudo aplicar el filtro a la foto.');
  }
  context.filter = CAPTURE_FILTERS[filter];
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  if (filter === 'sparkles') drawSparkles(context, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('No se pudo preparar la foto.')), 'image/jpeg', 0.88);
  });
}

function drawSparkles(context, width, height) {
  const positions = [[0.14, 0.2], [0.74, 0.18], [0.87, 0.42], [0.22, 0.7], [0.66, 0.78], [0.48, 0.35]];
  context.save();
  context.fillStyle = '#ffe680';
  context.shadowColor = '#fff4bd';
  context.shadowBlur = Math.max(5, width / 100);
  positions.forEach(([x, y], index) => {
    const size = Math.max(8, Math.min(width, height) * (index % 2 ? 0.018 : 0.025));
    context.beginPath();
    context.moveTo(x * width, y * height - size);
    context.lineTo(x * width + size * 0.25, y * height - size * 0.25);
    context.lineTo(x * width + size, y * height);
    context.lineTo(x * width + size * 0.25, y * height + size * 0.25);
    context.lineTo(x * width, y * height + size);
    context.lineTo(x * width - size * 0.25, y * height + size * 0.25);
    context.lineTo(x * width - size, y * height);
    context.lineTo(x * width - size * 0.25, y * height - size * 0.25);
    context.closePath();
    context.fill();
  });
  context.restore();
}

function makeUploadFilename(mimeType) {
  const extension = {
    'image/jpeg': 'jpg',
    'video/mp4': 'mp4',
    'video/webm': 'webm'
  }[mimeType] || (mimeType.startsWith('image/') ? 'jpg' : 'webm');
  return `captura-${Date.now()}.${extension}`;
}

function getUploadMimeType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image/jpeg';
  return mimeType.startsWith('video/mp4') ? 'video/mp4' : 'video/webm';
}

function setCaptureStatus(message) {
  const status = document.getElementById('ar-capture-status');
  if (status) status.textContent = message;
}

function updateCaptureButtons() {
  const captureButton = document.getElementById('btn-camera-capture');
  const isRecording = Boolean(recordingSession);
  document.querySelectorAll('.ar-live-filter').forEach((button) => {
    button.disabled = isRecording || isCapturingPhoto || isUploadingCapture;
  });
  if (captureButton) {
    captureButton.disabled = !detectedTeamKey || isUploadingCapture || isCapturingPhoto;
    captureButton.classList.toggle('recording', isRecording);
    captureButton.innerHTML = isRecording
      ? '<i class="fa-solid fa-circle"></i><span>SUELTA PARA PUBLICAR</span>'
      : '<i class="fa-solid fa-camera"></i><span>TOCA: FOTO · MANTÉN: VIDEO</span>';
    captureButton.setAttribute('aria-label', isRecording
      ? 'Grabando video. Suelta el botón para publicar.'
      : 'Toca para tomar una foto o mantén presionado para grabar video.');
  }
}

export function openScannerView() {
  const detectedContent = document.getElementById('ar-detected-content');
  const modal = document.getElementById('ar-experience-modal');
  detectedTeamKey = null;
  selectCaptureFilter('none');
  updateCaptureButtons();
  setCaptureStatus('Reconoce un equipo para activar la captura.');
  if (detectedContent) detectedContent.classList.remove('hidden');
  if (modal) modal.classList.remove('hidden');
  
  abrirEscenaAR(); 
}

export function openVRDirectly(teamKey) {
  detectedTeamKey = teamKey || 'alg';
  state.setSelectedTeam(detectedTeamKey);
  const team = teamsData[state.currentSelectedTeamKey];
  if (!team) return;

  const titleEl = document.getElementById('ar-team-title');
  const summaryEl = document.getElementById('ar-team-summary');
  const modal = document.getElementById('ar-experience-modal');

  if (titleEl) titleEl.textContent = team.name;
  if (summaryEl) summaryEl.textContent = `${team.city} · ${team.stadium}`;
  if (modal) modal.classList.remove('hidden');

  updateCaptureButtons();
  setCaptureStatus(`Equipo listo: ${team.name}. Toca para foto o mantén para video.`);
  abrirEscenaAR();
  if (titleEl) titleEl.textContent = team.name;
  if (summaryEl) summaryEl.textContent = `${team.city} · ${team.stadium}`;
}

export function closeARView() {
  if (recordingSession) {
    recordingSession.discard = true;
    stopVideoRecording();
  }
  if (capturePressTimer) window.clearTimeout(capturePressTimer);
  capturePressTimer = null;
  captureGestureRecording = false;
  const sceneEl = document.querySelector('a-scene');
  const mindarSystem = sceneEl?.systems?.['mindar-image-system'];
  const cameraTracks = mindarSystem?.video?.srcObject?.getTracks?.() || [];
  if (cameraTracks.some((track) => track.readyState === 'live')) {
    try {
      mindarSystem.stop();
    } catch (error) {
      console.error('Error al detener la cámara del escáner:', error);
    } finally {
      cameraTracks.forEach((track) => track.stop());
    }
  }
  
  document.getElementById('ar-experience-modal')?.classList.add('hidden');
  
  // Ocultar también el modal de ayuda si estuviera abierto
  const arHelpModal = document.getElementById('ar-help-modal');
  if (arHelpModal) arHelpModal.style.display = 'none';

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
  initializeARModels();
  if (sceneEl && sceneEl.systems["mindar-image-system"]) {
    try {
      const startResult = sceneEl.systems["mindar-image-system"].start();
      if (startResult && typeof startResult.catch === 'function') {
        startResult.catch((error) => {
          console.error('No se pudo iniciar la cámara del escáner:', error);
          setCaptureStatus('No se pudo iniciar la cámara. Revisa los permisos del navegador.');
        });
      }
    } catch (error) {
      console.error('No se pudo iniciar la cámara del escáner:', error);
      setCaptureStatus('No se pudo iniciar la cámara. Revisa los permisos del navegador.');
    }
  }

  if (eventosAgregados) return;

  // Solo usamos JavaScript para actualizar los textos, A-Frame dibuja los modelos
  const mapeoEquipos = {
    0: 'ace', 1: 'alg', 2: 'tec', 3: 'cal', 4: 'cha',
    5: 'tor', 6: 'rie', 7: 'soc', 8: 'sul', 9: 'dor'
  };

  Object.keys(mapeoEquipos).forEach(index => {
    const targetEntity = document.querySelector(`#target-${index}`);
    if (targetEntity) {
      
     targetEntity.addEventListener('targetFound', () => {
        const teamKey = mapeoEquipos[index];
        const team = teamsData[teamKey];
        
        if (team) {
          detectedTeamKey = teamKey;
          state.setSelectedTeam(teamKey);
          if (titleEl) titleEl.textContent = team.name;
          if (summaryEl) summaryEl.textContent = `¡Capturado! ${team.city} · ${team.stadium}`;
          updateCaptureButtons();
          setCaptureStatus(`Equipo reconocido: ${team.name}. Ya puedes capturar y publicar.`);
        }
      });

      targetEntity.addEventListener('targetLost', () => {
        if (titleEl) titleEl.textContent = 'Buscando marcador...';
        if (detectedTeamKey) {
          const detectedTeam = teamsData[detectedTeamKey];
          if (summaryEl) summaryEl.textContent = `Último equipo reconocido: ${detectedTeam.name}.`;
        } else if (summaryEl) {
          summaryEl.textContent = 'Apunta con la cámara al logo de un equipo.';
        }
      });
    }
  });

  eventosAgregados = true;
}

function initializeARModels() {
  if (modelEventsAdded) return;
  document.querySelectorAll('#ar-3d-container a-gltf-model').forEach((model) => {
    model.addEventListener('model-loaded', () => fitARModel(model));
    model.addEventListener('model-error', (event) => {
      console.error(`No se pudo cargar el modelo AR ${model.getAttribute('src')}:`, event.detail);
      setCaptureStatus('No se pudo cargar el modelo 3D de este equipo.');
    });
    if (model.getObject3D('mesh')) fitARModel(model);
  });
  modelEventsAdded = true;
}

function fitARModel(model) {
  const THREE = window.AFRAME?.THREE;
  const object3D = model.getObject3D('mesh');
  if (!THREE || !object3D) {
    console.error('No se pudo preparar el modelo 3D del equipo.');
    setCaptureStatus('No se pudo preparar el modelo 3D de este equipo.');
    return;
  }

  model.object3D.position.set(0, 0, 0);
  model.object3D.scale.set(1, 1, 1);
  model.object3D.updateMatrixWorld(true);
  object3D.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object3D);
  if (bounds.isEmpty()) {
    console.error('El modelo 3D del equipo no contiene geometría visible.');
    setCaptureStatus('El modelo 3D de este equipo no contiene geometría visible.');
    return;
  }

  const size = bounds.getSize(new THREE.Vector3());
  const largestDimension = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(largestDimension) || largestDimension <= 0) {
    console.error('No se pudo calcular el tamaño del modelo 3D del equipo.');
    setCaptureStatus('No se pudo ajustar el tamaño del modelo 3D de este equipo.');
    return;
  }

  const scale = 0.65 / largestDimension;
  const center = bounds.getCenter(new THREE.Vector3());
  const targetZ = 0.12;
  model.object3D.scale.setScalar(scale);
  model.object3D.position.set(-center.x * scale, -center.y * scale, targetZ - center.z * scale);
  model.object3D.updateMatrixWorld(true);
}