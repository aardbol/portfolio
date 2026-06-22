(() => {
  const html = document.documentElement;
  const STORAGE_KEY = 'theme';
  const ICONS = { light: '\u2600', dark: '\u263D' };
  const LABELS = { light: 'Light', dark: 'Dark' };

  let saved = localStorage.getItem(STORAGE_KEY);
  let current = saved === 'light' || saved === 'dark' ? saved : null;
  let manualOverride = saved !== null;

  function effective() {
    return current || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function apply(mode) {
    html.setAttribute('data-theme', mode);
    current = mode;
    updateHljsTheme();
  }

  function cycle() {
    const next = effective() === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem(STORAGE_KEY, next);
    manualOverride = true;
    updateButtons();
    window.dispatchEvent(new CustomEvent('themechange'));
  }

  function updateButtons() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      const m = effective();
      btn.textContent = ICONS[m];
      btn.title = `Theme: ${LABELS[m]} — click to toggle`;
    });
  }

  function updateHljsTheme() {
    const link = document.getElementById('hljs-theme');
    if (!link) return;
    const base = link.href.replace(/hljs(-light)?\.css$/, '');
    link.href = base + (effective() === 'dark' ? 'hljs.css' : 'hljs-light.css');
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

  apply(effective());

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!manualOverride) {
      apply(effective());
      updateButtons();
      window.dispatchEvent(new CustomEvent('themechange'));
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', cycle);
    });
    updateButtons();
    updateHljsTheme();
  });

  window.__theme = {
    getAccentHSL: () => {
      const accent = getComputedStyle(html).getPropertyValue('--tag-accent').trim();
      return hexToHSL(accent);
    },
    getBubbleVars: (rank) => {
      const dark = effective() === 'dark';
      return {
        bgAlpha: ((dark ? 0.04 : 0.06) + rank * (dark ? 0.18 : 0.22)).toFixed(2),
        lum: Math.round((dark ? 85 : 55) - rank * (dark ? 15 : 20)),
      };
    },
    cycle,
    getMode: () => effective(),
  };
})();
