/**
 * Gestor de ventanas modales
 */
export const modalManager = {
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  initModalEvents() {
    // Historia
    const btnCloseHistory = document.getElementById('btn-close-history');
    const btnHistoryUnderstood = document.getElementById('btn-history-understood');
    if (btnCloseHistory) btnCloseHistory.onclick = () => this.closeModal('history-modal');
    if (btnHistoryUnderstood) btnHistoryUnderstood.onclick = () => this.closeModal('history-modal');

    // Sin Puntos
    const btnCloseNoPoints = document.getElementById('btn-close-no-points');
    const btnNoPointsUnderstood = document.getElementById('btn-no-points-understood');
    if (btnCloseNoPoints) btnCloseNoPoints.onclick = () => this.closeModal('no-points-modal');
    if (btnNoPointsUnderstood) btnNoPointsUnderstood.onclick = () => this.closeModal('no-points-modal');

    // Recompensa Gacha
    const btnCloseReward = document.getElementById('btn-close-reward');
    const btnClaimReward = document.getElementById('btn-claim-reward');
    if (btnCloseReward) btnCloseReward.onclick = () => this.closeModal('reward-modal');
    if (btnClaimReward) btnClaimReward.onclick = () => this.closeModal('reward-modal');
  }
};
