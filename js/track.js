const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';

window.dataLayer = window.dataLayer || [];

function track(event, data = {}) {
  window.dataLayer.push({ event, ...data });

  if (typeof window.fbq === 'function') {
    if (event === 'lead') fbq('track', 'Lead', data);
    else fbq('trackCustom', event, data);
  }

  if (DEBUG) console.log('[track]', event, data);
}

// utm зберігаємо на 30 днів
(() => {
  const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'subid'];
  const MAX_AGE = 30 * 864e5;

  let utm = {};
  try {
    utm = JSON.parse(localStorage.getItem('svitlyk_utm') || '{}');
  } catch (e) {}

  const fromUrl = {};
  KEYS.forEach(k => {
    if (params.get(k)) fromUrl[k] = params.get(k);
  });

  if (Object.keys(fromUrl).length) {
    utm = { ...fromUrl, ts: Date.now() };
    try {
      localStorage.setItem('svitlyk_utm', JSON.stringify(utm));
    } catch (e) {}
  } else if (utm.ts && Date.now() - utm.ts > MAX_AGE) {
    utm = {};
  }

  KEYS.forEach(k => {
    const input = document.querySelector(`input[name="${k}"]`);
    if (input && utm[k]) input.value = utm[k];
  });

  track('page_view');
})();
