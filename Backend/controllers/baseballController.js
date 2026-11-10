const CACHE_DURATION_MS = 10 * 60 * 1000;
const cache = new Map();

const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const getCached = async (key, load) => {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await load();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_DURATION_MS });
  return value;
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const error = new Error(`El proveedor respondió con estado ${response.status}`);
      error.status = response.status === 429 ? 503 : 502;
      throw error;
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('El proveedor tardó demasiado en responder');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const obtenerNoticias = async (_req, res) => {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Configura GNEWS_API_KEY como variable de entorno (en .env local o en Vercel) para activar las noticias.'
    });
  }

  try {
    const url = new URL('https://gnews.io/api/v4/search');
    url.search = new URLSearchParams({
      q: 'béisbol',
      lang: 'es',
      country: 'mx',
      max: '10',
      sortby: 'publishedAt',
      apikey: apiKey
    });

    const data = await getCached('news-es-mx', () => fetchJson(url));
    const articles = (Array.isArray(data.articles) ? data.articles : [])
      .filter((article) => article.title && isHttpUrl(article.url))
      .map((article) => ({
        title: article.title,
        description: article.description || '',
        image: isHttpUrl(article.image) ? article.image : '',
        url: article.url,
        publishedAt: article.publishedAt || '',
        source: article.source?.name || 'Fuente original'
      }));

    return res.json({ source: 'GNews', articles });
  } catch (error) {
    console.error('Error al obtener noticias de béisbol:', error.message);
    return res.status(error.status || 502).json({
      error: 'No se pudieron cargar las noticias de béisbol.'
    });
  }
};

const getNextGameDates = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const year = Number(dateParts.year);
  const month = Number(dateParts.month);
  const day = Number(dateParts.day);

  return Array.from({ length: 7 }, (_value, offset) => {
    const date = new Date(Date.UTC(year, month - 1, day + offset));
    const dateLabel = [
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
      date.getUTCFullYear()
    ].join('/');
    const startDate = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      6
    );

    return {
      dateLabel,
      daysFromNow: offset,
      startDate,
      endDate: startDate + 24 * 60 * 60 * 1000 - 1
    };
  });
};

const obtenerPartidos = async (_req, res) => {
  try {
    const games = await getCached('lmb-games-next-7-days', async () => {
      const dateRequests = getNextGameDates();
      const calendars = await Promise.all(dateRequests.map((date) => {
        const url = new URL('https://lmb.com.mx/juegos/api/calendar');
        url.search = new URLSearchParams({
          date: date.dateLabel,
          daysFromNow: String(date.daysFromNow),
          startDate: String(date.startDate),
          endDate: String(date.endDate)
        });
        return fetchJson(url);
      }));

      const now = Date.now();
      const uniqueGames = new Map(
        calendars
          .flatMap((calendar) => Array.isArray(calendar.games_info) ? calendar.games_info : [])
          .filter((game) => (
            game.gameId
            && Number.isFinite(Number(game.date_time))
            && Number(game.date_time) * 1000 >= now
            && game.awayTeam?.name
            && game.localTeam?.name
          ))
          .map((game) => [game.gameId, {
            id: game.gameId,
            date: new Date(Number(game.date_time) * 1000).toISOString(),
            awayTeam: game.awayTeam.name,
            homeTeam: game.localTeam.name,
            awayLogo: game.awayTeam.urlLogo || '',
            homeLogo: game.localTeam.urlLogo || '',
            status: game.detailedStatus || game.status || ''
          }])
      );
      return Array.from(uniqueGames.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return res.json({ source: 'LMB', days: 7, games });
  } catch (error) {
    console.error('Error al obtener el calendario de la LMB:', error.message);
    return res.status(error.status || 502).json({
      error: 'No se pudo cargar el calendario de la Liga Mexicana de Beisbol.'
    });
  }
};

module.exports = { obtenerNoticias, obtenerPartidos };
