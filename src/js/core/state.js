export const state = {
  userPoints: 0,
  currentSelectedTeamKey: 'alg',
  currentUser: {
    id: null,
    token: null,
    name: '',
    email: '',
    fotoPerfil: '',
    inventory: []
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

  setSession({ id, token, name, email, points, fotoPerfil = '' }) {
    this.currentUser.id = id;
    this.currentUser.token = token;
    this.currentUser.name = name;
    this.currentUser.email = email;
    this.currentUser.fotoPerfil = fotoPerfil;
    this.userPoints = points;
    this.currentUser.inventory = [];
    this.notify('session');
  },

  setUserProfile({ name, email, fotoPerfil = this.currentUser.fotoPerfil }) {
    this.currentUser.name = name;
    this.currentUser.email = email;
    this.currentUser.fotoPerfil = fotoPerfil;
    this.notify('profile');
  },

  setInventory(inventory) {
    this.currentUser.inventory = inventory;
    this.notify('inventory');
  },

  setPoints(points) {
    this.userPoints = points;
    this.notify('points');
  },

  clearSession() {
    this.currentUser = { id: null, token: null, name: '', email: '', fotoPerfil: '', inventory: [] };
    this.userPoints = 0;
    this.notify('session');
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
