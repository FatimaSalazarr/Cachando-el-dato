import { state } from '../core/state.js';
import { modalManager } from '../components/modalManager.js';
import { apiRequest } from '../core/api.js';
import { showAppAlert } from '../core/alerts.js';

export function initGachaView() {
  const btnLaunch = document.getElementById('btn-launch');
  if (!btnLaunch) return;

  btnLaunch.onclick = async () => {
    if (state.userPoints < 50) {
      modalManager.openModal('no-points-modal');
      return;
    }

    btnLaunch.disabled = true;
    let reward;
    try {
      const result = await apiRequest('/game/gacha', { method: 'POST', body: '{}' });
      state.setPoints(result.puntosRestantes);
      state.setInventory([...state.currentUser.inventory, result.premio]);
      reward = result.premio;
    } catch (error) {
      if (error.status === 400 && Number.isFinite(error.data?.puntosActuales)) {
        state.setPoints(error.data.puntosActuales);
        modalManager.openModal('no-points-modal');
      } else {
        console.error('Error al lanzar el gacha:', error);
        await showAppAlert({
          icon: 'error',
          title: 'No se pudo realizar el lanzamiento',
          text: error.message || 'Intenta de nuevo.'
        });
      }
      btnLaunch.disabled = false;
      return;
    }

    const ball = document.getElementById('baseball-ball');
    const bat = document.getElementById('baseball-bat');

    if (ball) ball.classList.remove('ball-fly-away');
    if (bat) bat.classList.remove('bat-swing-hit');

    if (ball) void ball.offsetWidth;

    if (bat) bat.classList.add('bat-swing-hit');

    setTimeout(() => {
      if (ball) ball.classList.add('ball-fly-away');
    }, 300);

    setTimeout(() => {
      const rarity = document.getElementById('reward-rarity');
      const title = document.getElementById('reward-title');
      const description = document.getElementById('reward-desc');
      const rewardCard = document.querySelector('.reward-card-enhanced');
      if (rarity) {
        rarity.textContent = reward.rarezaLabel;
        rarity.dataset.rarity = reward.rareza;
      }
      if (title) title.textContent = `${reward.tag} · ${reward.nombre || reward.equipo}`;
      if (description) description.textContent = `${reward.tipo || 'Tarjeta'} agregada a tu inventario.`;
      if (rewardCard) rewardCard.dataset.rarity = reward.rareza;
      modalManager.openModal('reward-modal');
      showRewardModel(reward);

      if (ball) ball.classList.remove('ball-fly-away');
      if (bat) bat.classList.remove('bat-swing-hit');
      btnLaunch.disabled = false;
    }, 1300);
  };
}

function showRewardModel(reward) {
  const model = document.getElementById('reward-model');
  const modelStatus = document.getElementById('reward-model-status');
  if (!model || !modelStatus) return;

  if (!reward.modeloUrl) {
    modelStatus.textContent = 'Este premio no tiene un modelo 3D asociado.';
    return;
  }

  modelStatus.textContent = 'Cargando modelo 3D...';
  model.addEventListener('load', () => {
    modelStatus.textContent = '';
  }, { once: true });
  model.addEventListener('error', () => {
    modelStatus.textContent = 'No se pudo cargar el modelo 3D.';
  }, { once: true });
  model.removeAttribute('src');
  model.setAttribute('src', reward.modeloUrl);
}
