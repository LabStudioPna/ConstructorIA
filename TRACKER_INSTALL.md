# 📊 Tracker de Vistas — Instalación en las 4 landings

## ⚠️ Qué estaba roto (y ya arreglado)

El código anterior tenía 3 bugs:
1. **URL incorrecta** — usaba la URL del editor de n8n (`/workflow/...`) en vez del webhook real (`/webhook/labstudio-visitas`)
2. **Método incorrecto** — mandaba `POST` con JSON, pero el workflow espera `GET` (esto además generaba un preflight CORS que fallaba silenciosamente)
3. **Caracteres griegos** — "fiscoια", "campoια", "mipropια" tenían letras griegas (ι, α) en vez de "i", "a" latinas, así que la comparación de texto nunca daba `true`

Ya corregí el workflow en n8n ("LABStudio — Visitas v6") para que acepte un parámetro `landing` explícito por query string, y reescribí el `tracker.js`. Ahora es mucho más simple: un solo `fetch GET`, sin geolocalización client-side (eso ya lo hace el workflow del lado del servidor con la IP real).

**Acción tuya pendiente:** agregá el header `landing` en la celda **H1** de tu Google Sheet ("Vistas Web Labs"), si no está ya. El workflow ahora escribe esa columna.

---

## ✅ Instalado en ConstructorIA

- `tracker.js` (corregido) en la raíz
- `index.html` y `404.html` ya cargan `<script src="tracker.js" defer></script>` en el `<head>`

---

## 📥 Instalación en FiscoIA, CampoIA, MiPropIA

### 1. Crea el archivo `tracker.js` en la raíz de cada repo con este contenido exacto:

```javascript
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
```

### 2. En el `<head>` de `index.html`, agrega esta línea **justo antes de `</head>`**:

```html
<script src="tracker.js" defer></script>
```

### 3. Commit y push

```bash
git add tracker.js index.html
git commit -m "Fix view tracker: correct webhook URL and GET method"
git push
```

---

## 📊 Qué se registra por cada visita

| Campo | Ejemplo |
|-------|---------|
| **landing** | ConstructorIA, FiscoIA, CampoIA, MiPropIA |
| **fecha** | 17/7/2026, 14:30:45 (calculada server-side) |
| **ip** | 190.136.83.82 (capturada server-side, real) |
| **pais** | Argentina (geolocalizado server-side vía ipwho.is) |
| **ciudad** | Paraná |
| **dispositivo** | Desktop / Mobile |
| **pagina** | URL completa enviada por el navegador |

---

## ✅ Verificación

1. Abrí F12 → pestaña Network → filtrá por "labstudio-visitas"
2. Recargá la landing
3. Deberías ver una request `GET` a `.../webhook/labstudio-visitas?landing=...&pagina=...` con status 200
4. En 1-2 segundos aparece una fila nueva en tu Sheet

Si la request da 404: el workflow no está activo en n8n (verificar que "LABStudio — Visitas v6" esté en estado *Active*).

---

**Instalado:** ConstructorIA ✅  
**Pendiente:** FiscoIA, CampoIA, MiPropIA (repetir pasos 1-3 en cada repo)
