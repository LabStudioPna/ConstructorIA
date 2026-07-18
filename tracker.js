// Tracker de vistas - Envía ping GET al workflow n8n "LABStudio — Visitas v6"
// El workflow geolocaliza la IP y guarda todo en Google Sheets automáticamente.
(function() {
  const WEBHOOK_URL = 'https://vps-6064485-x.dattaweb.com/webhook/labstudio-visitas';

  // Detectar landing por el path de GitHub Pages
  const getLandingName = () => {
    const path = window.location.pathname.split('/')[1].toLowerCase();
    if (path === 'constructoria') return 'ConstructorIA';
    if (path === 'fiscoia') return 'FiscoIA';
    if (path === 'campoia') return 'CampoIA';
    if (path === 'mipropia') return 'MiPropIA';
    if (!path) return 'LABStudio';
    return 'Desconocida';
  };

  // Enviar ping GET (sin body, sin headers custom -> sin preflight CORS)
  const trackView = () => {
    const params = new URLSearchParams({
      landing: getLandingName(),
      pagina: window.location.href
    });

    fetch(`${WEBHOOK_URL}?${params.toString()}`, { method: 'GET' })
      .catch(error => console.log('Tracker error (no crítico):', error));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackView);
  } else {
    trackView();
  }
})();
