import { state } from '../core/state.js';
import { modalManager } from '../components/modalManager.js';

let carouselInterval = null;
let currentNewsIndex = 0;

export function initHomeView(onSelectTeamCallback) {
  // Carrusel de noticias
  const slides = document.querySelectorAll('.news-slide');
  const dots = document.querySelectorAll('.dot');

  function showSlide(index) {
    if (!slides.length) return;
    if (index >= slides.length) currentNewsIndex = 0;
    else if (index < 0) currentNewsIndex = slides.length - 1;
    else currentNewsIndex = index;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    if (slides[currentNewsIndex]) slides[currentNewsIndex].classList.add('active');
    if (dots[currentNewsIndex]) dots[currentNewsIndex].classList.add('active');
  }

  dots.forEach((dot, idx) => {
    dot.onclick = () => showSlide(idx);
  });

  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    currentNewsIndex++;
    showSlide(currentNewsIndex);
  }, 4000);

  // Equipos en cuadrícula
  const teamItems = document.querySelectorAll('.team-cube-item');
  teamItems.forEach(item => {
    item.onclick = () => {
      const key = item.getAttribute('data-team-key');
      if (key && onSelectTeamCallback) {
        onSelectTeamCallback(key);
      }
    };
  });

  // Botón abrir historia
  const btnHistory = document.getElementById('btn-open-history');
  if (btnHistory) {
    btnHistory.onclick = () => modalManager.openModal('history-modal');
  }
}

export function destroyHomeView() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
}
