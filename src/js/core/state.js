export const state = {
  userPoints: 80,
  currentSelectedTeamKey: 'alg',
  currentUser: {
    name: 'ac',
    email: 'ac@gmail.com',
    itemsCount: 2,
    rareCount: 1,
    legendaryCount: 0
  },
  currentScreen: 'login-screen',
  currentTab: 'home-screen',

  listeners: [],

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  addPoints(points) {
    this.userPoints += points;
    this.notify('points');
  },

  deductPoints(points) {
    if (this.userPoints >= points) {
      this.userPoints -= points;
      this.notify('points');
      return true;
    }
    return false;
  },

  setSelectedTeam(teamKey) {
    this.currentSelectedTeamKey = teamKey;
    this.notify('team');
  },

  setScreen(screenId) {
    this.currentScreen = screenId;
    this.notify('screen');
  },

  setTab(tabId) {
    this.currentTab = tabId;
    this.notify('tab');
  },

  notify(changeType) {
    this.listeners.forEach(fn => fn(this, changeType));
    this.syncPointsDisplay();
  },

  syncPointsDisplay() {
    document.querySelectorAll('.user-pts-display').forEach(el => {
      el.textContent = this.userPoints;
    });
  }
};
