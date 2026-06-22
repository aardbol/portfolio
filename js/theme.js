(() => {
  const html = document.documentElement;
  const STORAGE_KEY = 'theme';
  const MODES = ['auto', 'light', 'dark'];
  const ICONS = { auto: '\u25D0', light: '\u2600', dark: '\u263D' };
  const LABELS = { auto: 'Auto', light: 'Light', dark: 'Dark' };

  let current = localStorage.getItem(STORAGE_KEY) || 'auto';

  function apply(mode) {
    if (mode === 'auto') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', mode);
    }
    current = mode;
    if (mode === 'auto') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }

  function cycle() {
    const idx = MODES.indexOf(current);
    const next = MODES[(idx + 1) % MODES.length];
    apply(next);
    updateButtons();
    window.dispatchEvent(new CustomEvent('themechange'));
  }

  function updateButtons() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = ICONS[current];
      btn.title = `Theme: ${LABELS[current]} — click to cycle`;
    });
  }

  function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function getAccentHSL() {
    const accent = getComputedStyle(html).getPropertyValue('--accent').trim();
    return hexToHSL(accent);
  }

  apply(current);

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', cycle);
    });
    updateButtons();
  });

  window.__theme = { getAccentHSL, cycle, getMode: () => current };
})();
