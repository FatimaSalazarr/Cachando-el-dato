import { state } from '../core/state.js';
import { modalManager } from '../components/modalManager.js';

export function initGachaView() {
  const btnLaunch = document.getElementById('btn-launch');
  if (!btnLaunch) return;

  btnLaunch.onclick = () => {
    if (state.userPoints < 50) {
      modalManager.openModal('no-points-modal');
      return;
    }

    const ball = document.getElementById('baseball-ball');
    const bat = document.getElementById('baseball-bat');

    btnLaunch.disabled = true;
    state.deductPoints(50);

    if (ball) ball.classList.remove('ball-fly-away');
    if (bat) bat.classList.remove('bat-swing-hit');

    if (ball) void ball.offsetWidth;

    if (bat) bat.classList.add('bat-swing-hit');

    setTimeout(() => {
      if (ball) ball.classList.add('ball-fly-away');
    }, 300);

    setTimeout(() => {
      modalManager.openModal('reward-modal');

      if (ball) ball.classList.remove('ball-fly-away');
      if (bat) bat.classList.remove('bat-swing-hit');
      btnLaunch.disabled = false;
    }, 1300);
  };
}
