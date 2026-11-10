import { modalManager } from '../components/modalManager.js';

let carouselInterval = null;
let currentNewsIndex = 0;

const createStatus = (message, isError = false) => {
  const status = document.createElement('p');
  status.className = `feed-status${isError ? ' is-error' : ''}`;
  status.setAttribute('role', 'status');
  status.textContent = message;
  return status;
};

const fetchFeed = async (endpoint) => {
  const response = await fetch(`/api/game/baseball/${endpoint}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo cargar el contenido.');
  return data;
};

const formatNewsDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const renderNews = async () => {
  const track = document.getElementById('news-track');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!track || !dotsContainer) return;

  try {
    const { articles } = await fetchFeed('news');
    track.replaceChildren();
    dotsContainer.replaceChildren();

    if (!articles.length) {
      track.append(createStatus('No hay noticias disponibles por el momento.'));
      return;
    }

    articles.slice(0, 8).forEach((article, index) => {
      const slide = document.createElement('article');
      slide.className = `news-slide${index === 0 ? ' active' : ''}`;

      const link = document.createElement('a');
      link.className = 'news-card-link';
      link.href = article.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Leer en ${article.source}: ${article.title}`);

      const visual = document.createElement('div');
      visual.className = 'news-visual';

      const placeholder = document.createElement('span');
      placeholder.className = 'news-image-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      const placeholderIcon = document.createElement('i');
      placeholderIcon.className = 'fa-solid fa-baseball';
      placeholder.append(placeholderIcon);
      visual.append(placeholder);

      if (article.image) {
        const image = document.createElement('img');
        image.className = 'news-image';
        image.src = article.image;
        image.alt = '';
        image.loading = 'lazy';
        image.addEventListener('error', () => image.remove(), { once: true });
        visual.append(image);
      }

      const source = document.createElement('span');
      source.className = 'news-source';
      source.textContent = article.source || 'Béisbol';
      visual.append(source);

      const content = document.createElement('div');
      content.className = 'news-content';

      const title = document.createElement('h3');
      title.textContent = article.title;

      const description = document.createElement('p');
      description.className = 'news-description';
      description.textContent = article.description || 'Lee la nota completa en su fuente original.';

      const meta = document.createElement('span');
      meta.className = 'news-time';
      const date = formatNewsDate(article.publishedAt);
      meta.textContent = date ? `${date} · Leer noticia` : 'Leer noticia';

      content.append(title, description, meta);
      link.append(visual, content);
      slide.append(link);
      track.append(slide);

      const dot = document.createElement('button');
      dot.className = `dot${index === 0 ? ' active' : ''}`;
      dot.type = 'button';
      dot.setAttribute('aria-label', `Mostrar noticia ${index + 1}`);
      dot.addEventListener('click', () => showSlide(index));
      dotsContainer.append(dot);
    });

    currentNewsIndex = 0;
    if (articles.length > 1) {
      carouselInterval = setInterval(() => showSlide(currentNewsIndex + 1), 6000);
    }
  } catch (error) {
    track.replaceChildren(createStatus(error.message, true));
  }
};

function showSlide(index) {
  const slides = document.querySelectorAll('.news-slide');
  const dots = document.querySelectorAll('#carousel-dots .dot');
  if (!slides.length) return;

  currentNewsIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle('active', slideIndex === currentNewsIndex);
  });
  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === currentNewsIndex;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-pressed', String(isActive));
  });
}

const initials = (name) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase();

const renderGames = async () => {
  const list = document.getElementById('upcoming-games-list');
  if (!list) return;

  try {
    const { games } = await fetchFeed('games');
    list.replaceChildren();

    if (!games.length) {
      list.append(createStatus('No hay partidos de la LMB programados para los próximos 7 días.'));
      return;
    }

    games.slice(0, 10).forEach((game) => {
      const card = document.createElement('article');
      card.className = 'match-card';

      const matchup = document.createElement('div');
      matchup.className = 'matchup-line';

      const awayBadge = document.createElement('span');
      awayBadge.className = 'team-initials';
      awayBadge.textContent = initials(game.awayTeam);
      if (game.awayLogo) {
        const logo = document.createElement('img');
        logo.src = game.awayLogo;
        logo.alt = '';
        logo.loading = 'lazy';
        logo.addEventListener('error', () => logo.remove(), { once: true });
        awayBadge.append(logo);
      }

      const awayName = document.createElement('span');
      awayName.className = 'match-team-name';
      awayName.textContent = game.awayTeam;

      const at = document.createElement('span');
      at.className = 'match-at';
      at.textContent = '@';

      const homeBadge = document.createElement('span');
      homeBadge.className = 'team-initials is-home';
      homeBadge.textContent = initials(game.homeTeam);
      if (game.homeLogo) {
        const logo = document.createElement('img');
        logo.src = game.homeLogo;
        logo.alt = '';
        logo.loading = 'lazy';
        logo.addEventListener('error', () => logo.remove(), { once: true });
        homeBadge.append(logo);
      }

      const homeName = document.createElement('span');
      homeName.className = 'match-team-name';
      homeName.textContent = game.homeTeam;

      matchup.append(awayBadge, awayName, at, homeBadge, homeName);

      const info = document.createElement('div');
      info.className = 'match-info';

      const time = document.createElement('p');
      const timeIcon = document.createElement('i');
      timeIcon.className = 'fa-regular fa-clock';
      const gameDate = new Date(game.date);
      const formattedDate = Number.isNaN(gameDate.getTime())
        ? 'Horario por confirmar'
        : gameDate.toLocaleString('es-MX', {
          timeZone: 'America/Mexico_City',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit'
        });
      time.append(timeIcon, document.createTextNode(` ${formattedDate}`));

      info.append(time);
      card.append(matchup, info);
      list.append(card);
    });
  } catch (error) {
    list.replaceChildren(createStatus(error.message, true));
  }
};

export function initHomeView(onSelectTeamCallback) {
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = null;
  void renderNews();
  void renderGames();

  document.querySelectorAll('.team-cube-item').forEach((item) => {
    item.onclick = () => {
      const key = item.getAttribute('data-team-key');
      if (key && onSelectTeamCallback) onSelectTeamCallback(key);
    };
  });

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
