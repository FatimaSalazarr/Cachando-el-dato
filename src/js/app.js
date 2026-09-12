import { state } from './core/state.js';
import { renderTemplateInto, loadTemplate } from './core/viewLoader.js';
import { initAuthView, switchAuthScreen } from './views/authView.js';
import { initHomeView } from './views/homeView.js';
import { initTeamDetailView, renderTeamDetail } from './views/teamDetailView.js';
import { initGachaView } from './views/gachaView.js';
import { initTriviaView } from './views/triviaView.js';
import { initProfileView, renderProfile } from './views/profileView.js';
import { initARView, openScannerView, openVRDirectly, closeARView, takePhoto } from './views/arView.js';
import { modalManager } from './components/modalManager.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadAllTemplates();
    this.setupNavigation();
    this.setupGlobalEvents();
    state.syncPointsDisplay();

    // Iniciar vistas
    initAuthView((defaultTab) => this.navigateToApp(defaultTab));
    initHomeView((teamKey) => this.openTeamDetail(teamKey));
    initTeamDetailView(
      () => this.switchTab('home-screen'),
      (teamKey) => openVRDirectly(teamKey),
      () => this.switchTab('trivia-screen')
    );
    initGachaView();
    initTriviaView();
    initProfileView(() => this.logout());
    initARView((teamKey) => this.openTeamDetail(teamKey));
    modalManager.initModalEvents();

    // Exponer compatibilidad global para callbacks de inline onclicks si fuera necesario
    window.app = this;
    window.switchAuthScreen = switchAuthScreen;
    window.navigateToApp = (tab) => this.navigateToApp(tab);
    window.switchTab = (tab, el) => this.switchTab(tab, el);
    window.openTeamDetail = (teamKey) => this.openTeamDetail(teamKey);
    window.backToHome = () => this.switchTab('home-screen');
    window.openScannerView = openScannerView;
    window.closeARView = closeARView;
    window.openVRDirectly = openVRDirectly;
    window.openVRFromDetail = () => openVRDirectly(state.currentSelectedTeamKey);
    window.takePhoto = takePhoto;
  }

  async loadAllTemplates() {
    await Promise.all([
      // Vistas de Autenticación
      renderTemplateInto('src/templates/views/login.html', document.getElementById('login-screen')),
      renderTemplateInto('src/templates/views/register.html', document.getElementById('register-screen')),

      // Vistas Principales (Tabs)
      renderTemplateInto('src/templates/views/home.html', document.getElementById('home-screen')),
      renderTemplateInto('src/templates/views/team-detail.html', document.getElementById('team-detail-screen')),
      renderTemplateInto('src/templates/views/gacha.html', document.getElementById('gacha-screen')),
      renderTemplateInto('src/templates/views/trivia.html', document.getElementById('trivia-screen')),
      renderTemplateInto('src/templates/views/profile.html', document.getElementById('profile-screen')),

      // Vista Escáner Realidad Aumentada
      renderTemplateInto('src/templates/views/ar-scanner.html', document.getElementById('ar-experience-modal')),

      // Barra de navegación inferior
      renderTemplateInto('src/templates/components/bottom-nav.html', document.getElementById('bottom-nav-container'))
    ]);

    // Modales Reutilizables
    const modalsContainer = document.getElementById('modals-container');
    if (modalsContainer) {
      const [historyHtml, noPointsHtml, rewardHtml] = await Promise.all([
        loadTemplate('src/templates/components/modal-history.html'),
        loadTemplate('src/templates/components/modal-no-points.html'),
        loadTemplate('src/templates/components/modal-reward.html')
      ]);
      modalsContainer.innerHTML = (historyHtml || '') + (noPointsHtml || '') + (rewardHtml || '');
    }

    // Componentes incrustados dentro de vistas (Top Bar)
    const topBarPlaceholders = document.querySelectorAll('.top-bar-placeholder');
    for (const ph of topBarPlaceholders) {
      await renderTemplateInto('src/templates/components/top-bar.html', ph);
    }
  }

  setupNavigation() {
    const tabButtons = document.querySelectorAll('.bottom-tab-bar .tab-btn');
    tabButtons.forEach(btn => {
      btn.onclick = () => {
        const tabId = btn.getAttribute('data-tab');
        if (tabId) this.switchTab(tabId, btn);
      };
    });

    const centerCamBtn = document.getElementById('btn-center-camera');
    if (centerCamBtn) {
      centerCamBtn.onclick = () => openScannerView();
    }
  }

  setupGlobalEvents() {
    state.subscribe((currentState, changeType) => {
      if (changeType === 'points') {
        currentState.syncPointsDisplay();
      }
    });
  }

  switchTab(tabId, clickedBtnElement) {
    document.querySelectorAll('.tab-screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bottom-tab-bar .tab-btn').forEach(b => b.classList.remove('active'));

    const targetScreen = document.getElementById(tabId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    if (clickedBtnElement) {
      clickedBtnElement.classList.add('active');
    } else {
      const matchingBtn = document.querySelector(`.bottom-tab-bar .tab-btn[data-tab="${tabId}"]`);
      if (matchingBtn) matchingBtn.classList.add('active');
    }

    if (tabId === 'profile-screen') {
      renderProfile();
    }
  }

  openTeamDetail(teamKey) {
    renderTeamDetail(teamKey);

    document.querySelectorAll('.tab-screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bottom-tab-bar .tab-btn').forEach(b => b.classList.remove('active'));

    const detailScreen = document.getElementById('team-detail-screen');
    if (detailScreen) {
      detailScreen.classList.add('active');
      detailScreen.scrollTop = 0;
    }
  }

  navigateToApp(defaultTabId = 'home-screen') {
    document.getElementById('login-screen')?.classList.remove('active');
    document.getElementById('register-screen')?.classList.remove('active');
    document.getElementById('app-content')?.classList.remove('hidden');

    this.switchTab(defaultTabId);
    state.syncPointsDisplay();
  }

  logout() {
    document.getElementById('app-content')?.classList.add('hidden');
    switchAuthScreen('login-screen');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
