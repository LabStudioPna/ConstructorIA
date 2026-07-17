// Tracker de vistas - Envía datos a n8n workflow
(function() {
  const WEBHOOK_URL = 'https://vps-6064485-x.dattaweb.com/workflow/tY9xOxrx1wtPtFIb';
  
  // Detectar landing (se pasa como parámetro)
  const getLandingName = () => {
    const url = window.location.hostname;
    if (url.includes('github.io')) {
      const path = window.location.pathname.split('/')[1].toLowerCase();
      if (path === 'constructoria' || url === 'labstudiopna.github.io' && path === '') return 'LABStudio';
      if (path === 'fiscoια') return 'FiscoIA';
      if (path === 'campoια') return 'CampoIA';
      if (path === 'mipropια') return 'MiPropIA';
    }
    return 'Desconocida';
  };

  // Detectar dispositivo
  const getDevice = () => {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) return 'Mobile';
    return 'Desktop';
  };

  // Obtener geolocalización e IP
  const getGeoLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/', { timeout: 5000 });
      const data = await response.json();
      return {
        ip: data.ip || 'Desconocida',
        pais: data.country_name || 'Desconocido',
        ciudad: data.city || 'Desconocida'
      };
    } catch (error) {
      console.log('Geo error (continuando):', error);
      return { ip: 'Error', pais: 'Desconocido', ciudad: 'Desconocida' };
    }
  };

  // Enviar datos al webhook
  const trackView = async () => {
    const geo = await getGeoLocation();
    const payload = {
      landing: getLandingName(),
      fecha: new Date().toLocaleString('es-AR'),
      ip: geo.ip,
      pais: geo.pais,
      ciudad: geo.ciudad,
      dispositivo: getDevice(),
      pagina: window.location.href
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.log('Tracker error (no crítico):', error);
    }
  };

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackView);
  } else {
    trackView();
  }
})();
