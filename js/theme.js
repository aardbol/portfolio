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
    updateHljsTheme();
  }

  function isDark() {
    if (html.hasAttribute('data-theme')) {
      return html.getAttribute('data-theme') === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function updateHljsTheme() {
    const link = document.getElementById('hljs-theme');
    if (!link) return;
    const base = link.href.replace(/hljs(-light)?\.css$/, '');
    link.href = base + (isDark() ? 'hljs.css' : 'hljs-light.css');
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
    const accent = getComputedStyle(html).getPropertyValue('--tag-accent').trim();
    return hexToHSL(accent);
  }

  function getBubbleVars(rank) {
    const dark = isDark();
    const baseAlpha = dark ? 0.04 : 0.06;
    const alphaRange = dark ? 0.18 : 0.22;
    const baseLum = dark ? 85 : 55;
    const lumRange = dark ? 15 : 20;
    return {
      bgAlpha: (baseAlpha + rank * alphaRange).toFixed(2),
      lum: Math.round(baseLum - rank * lumRange),
    };
  }

  apply(current);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (current === 'auto') {
      updateHljsTheme();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', cycle);
    });
    updateButtons();
    updateHljsTheme();
  });

  window.__theme = { getAccentHSL, getBubbleVars, cycle, getMode: () => current };
})();
