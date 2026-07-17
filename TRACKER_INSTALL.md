# 📊 Tracker de Vistas — Instalación en las 4 landings

El sistema de tracking está configurado para enviar datos automáticamente a tu Sheet a través del webhook de n8n.

## ✅ Instalado en ConstructorIA

`index.html` ya tiene el tracker integrado en `<head>`:
```html
<script src="tracker.js" defer></script>
```

---

## 📥 Instalación Manual en FiscoIA, CampoIA, MiPropIA

Para cada una de las otras 3 landings, **sigue estos pasos:**

### 1. **Crea el archivo `tracker.js`** en la raíz del repo con este contenido:

```javascript
// Tracker de vistas - Envía datos a n8n workflow
(function() {
  const WEBHOOK_URL = 'https://vps-6064485-x.dattaweb.com/workflow/tY9xOxrx1wtPtFIb';
  
  // Detectar landing
  const getLandingName = () => {
    const url = window.location.hostname;
    const path = window.location.pathname.split('/')[1].toLowerCase();
    if (path === 'fiscoia') return 'FiscoIA';
    if (path === 'campoια') return 'CampoIA';
    if (path === 'mipropia') return 'MiPropIA';
    return 'Desconocida';
  };

  // Detectar dispositivo
  const getDevice = () => {
    const ua = navigator.userAgent;
    return /Mobile|Android|iPhone|iPad|iPod/.test(ua) ? 'Mobile' : 'Desktop';
  };

  // Obtener geolocalización e IP
  const getGeoLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        ip: data.ip || 'Desconocida',
        pais: data.country_name || 'Desconocido',
        ciudad: data.city || 'Desconocida'
      };
    } catch (error) {
      return { ip: 'Error', pais: 'Desconocido', ciudad: 'Desconocida' };
    }
  };

  // Enviar datos
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
      console.log('Tracker error:', error);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackView);
  } else {
    trackView();
  }
})();
```

### 2. **En el `<head>` de index.html**, agrega esta línea antes de `</head>`:

```html
<script src="tracker.js" defer></script>
```

### 3. **Commit y push** a GitHub

```bash
git add tracker.js
git add index.html
git commit -m "Add view tracker (sends data to Sheet)"
git push
```

---

## 📊 Qué Se Registra

Cada vez que alguien abre una landing, se captura y envía a tu Sheet:

| Campo | Ejemplo |
|-------|---------|
| **landing** | ConstructorIA, FiscoIA, CampoIA, MiPropIA |
| **fecha** | 17/7/2026, 14:30:45 |
| **ip** | 190.136.83.82 |
| **pais** | Argentina |
| **ciudad** | Paraná |
| **dispositivo** | Desktop / Mobile |
| **pagina** | https://labstudiopna.github.io/FiscoIA/ |

---

## ✅ Verificación

Abrí cualquiera de las landings y en 2-3 segundos deberías ver una nueva fila en tu Sheet "Vistas Web Labs".

Si algo no funciona, revisa:
1. El webhook URL es correcto: `https://vps-6064485-x.dattaweb.com/workflow/tY9xOxrx1wtPtFIb`
2. El archivo `tracker.js` está en la raíz del repo
3. El `<script>` tag está en el `<head>` (antes de `</head>`)

---

**Instalado:** ConstructorIA ✅  
**Pendiente:** FiscoIA, CampoIA, MiPropIA (manual)
