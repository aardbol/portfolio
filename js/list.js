export function initList(config) {
  const content = document.getElementById('content');
  const tagCloud = document.getElementById('tag-cloud');
  let activeTag = null;
  let items = [];

  function loadData() {
    const el = document.getElementById(config.dataId);
    if (!el) throw new Error(`No embedded data found: #${config.dataId}`);
    return JSON.parse(el.textContent);
  }

  function router() {
    let hash = location.hash.slice(1);
    if (hash.startsWith('/')) hash = hash.slice(1);

    if (hash === '' || hash.startsWith('tag/')) {
      activeTag = hash.startsWith('tag/')
        ? decodeURIComponent(hash.split('/')[1])
        : null;
      buildTagCloud();
      filterCards();
    } else if (config.extraRoutes && config.extraRoutes[hash]) {
      content.innerHTML = config.extraRoutes[hash];
    } else {
      content.innerHTML = '<p>Page not found.</p>';
    }
  }

  function buildTagCloud() {
    const counts = {};
    items.forEach(p => p.tags.forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    }));

    const maxCount = Math.max(...Object.values(counts));
    const minCount = Math.min(...Object.values(counts));
    const sortedTags = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const { h, s } = window.__theme.getAccentHSL();

    const tagsHtml = sortedTags.map(([tag, count]) => {
      const rank = minCount === maxCount ? 0.5 : (count - minCount) / (maxCount - minCount);
      const size = 0.8 + rank * 0.55;
      const { bgAlpha, lum } = window.__theme.getBubbleVars(rank);

      const isActive = tag === activeTag;
      const targetHash = isActive ? '#/' : `#/tag/${encodeURIComponent(tag)}`;
      const inlineStyle = isActive
        ? `font-size:${size.toFixed(2)}rem`
        : `font-size:${size.toFixed(2)}rem;background:hsl(${h},${s}%,${(90 - rank * 15).toFixed(0)}%,${bgAlpha});color:hsl(${h},${s}%,${lum}%)`;

      const label = count === 1 ? config.singular : config.plural;
      return `<a href="${targetHash}" class="tag${isActive ? ' active' : ''}" style="${inlineStyle}" title="${count} ${label}">${tag}</a>`;
    }).join('');

    tagCloud.innerHTML = `
      <div class="tag-label">Filter by tag</div>
      <div class="cloud-tags">
        ${tagsHtml}
      </div>
    `;
  }

  function filterCards() {
    document.getElementById('filter-notice')?.remove();
    document.getElementById('no-match')?.remove();

    const cards = content.querySelectorAll(config.cardSelector);
    let visible = 0;

    cards.forEach(card => {
      if (activeTag) {
        const tags = card.dataset.tags.split(',');
        if (tags.includes(activeTag)) {
          card.classList.remove('hidden');
          visible++;
        } else {
          card.classList.add('hidden');
        }
      } else {
        card.classList.remove('hidden');
      }
    });

    if (activeTag) {
      const div = document.createElement('div');
      div.id = 'filter-notice';
      div.className = 'filter-notice';
      div.innerHTML = `Showing ${config.plural} tagged "<strong>${activeTag}</strong>". <a href="#/">Clear filter</a>`;
      content.insertBefore(div, content.firstChild);
    }

    if (activeTag && visible === 0) {
      const noMatch = document.createElement('p');
      noMatch.id = 'no-match';
      noMatch.textContent = `No ${config.plural} match this tag.`;
      content.querySelector(config.listSelector)?.appendChild(noMatch);
    }
  }

  window.addEventListener('hashchange', router);
  window.addEventListener('themechange', () => buildTagCloud());

  try {
    items = loadData();
    router();
  } catch (err) {
    content.innerHTML = `<p class="error">Error loading ${config.plural}: ${err.message}</p>`;
    console.error(err);
  }
}
