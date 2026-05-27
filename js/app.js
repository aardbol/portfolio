import { loadProjects } from './data.js';

const content = document.getElementById('content');
const tagCloud = document.getElementById('tag-cloud');
let allProjects = [];
let activeTag = null;

function router() {
  // Extract hash and strip leading slash if present
  let hash = location.hash.slice(1);
  if (hash.startsWith('/')) hash = hash.slice(1);

  if (hash === '' || hash.startsWith('tag/')) {
    if (hash.startsWith('tag/')) {
      activeTag = decodeURIComponent(hash.split('/')[1]);
    } else {
      activeTag = null; // Resets when hash is empty (Clear filter)
    }
    buildTagCloud();
    renderProjectList();
  } else if (hash === 'cv') {
    content.innerHTML = '<p>CV content or redirect...</p>';
  } else {
    content.innerHTML = '<p>Page not found.</p>';
  }
}

function buildTagCloud() {
  const counts = {};
  allProjects.forEach(p => p.tags.forEach(t => {
    counts[t] = (counts[t] || 0) + 1;
  }));

  const maxCount = Math.max(...Object.values(counts));
  const minCount = Math.min(...Object.values(counts));
  const sortedTags = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const tagsHtml = sortedTags.map(([tag, count]) => {
    const size = minCount === maxCount ? 1.2 :
      0.85 + ((count - minCount) / (maxCount - minCount)) * 0.75;
    
    const isActive = tag === activeTag;
    const targetHash = isActive ? '#/' : `#/tag/${encodeURIComponent(tag)}`;
    
    // Generate a consistent organic offset based on the tag's characters
    // This makes them bounce up and down in the cloud naturally
    const char1 = tag.charCodeAt(0) || 1;
    const char2 = tag.charCodeAt(tag.length - 1) || 1;
    const marginTop = (char1 * 13) % 18;
    const marginBottom = (char2 * 17) % 18;
    const marginLeft = ((char1 + char2) * 7) % 12;
    const marginRight = (char1 * 3) % 12;
    
    const organicMargin = `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`;
    
    return `<a href="${targetHash}" class="tag${isActive ? ' active' : ''}" style="font-size:${size.toFixed(2)}rem; margin: ${organicMargin};" title="${count} project${count > 1 ? 's' : ''}">${tag}</a>`;
  }).join('');

  tagCloud.innerHTML = `
    <div class="tag-label">Filter by tag</div>
    <div class="cloud-tags">
      ${tagsHtml}
    </div>
  `;
}

function renderProjectList() {
  const filtered = activeTag
    ? allProjects.filter(p => p.tags.includes(activeTag))
    : allProjects;

  filtered.sort((a, b) => b.date.localeCompare(a.date));

  const html = filtered.map(p => `
    <article class="project-card">
      <header class="project-header">
        <h2><a href="${p.url}" target="_blank" rel="noopener">${p.title}</a></h2>
        <time>${p.date}</time>
      </header>
      <p>${p.summary}</p>
      <div class="tags">${p.tags.map(t => `<span class="tag-pill">${t}</span>`).join(' ')}</div>
    </article>
  `).join('');

  content.innerHTML = `
    ${activeTag ? `<p class="filter-notice">Showing projects tagged "<strong>${activeTag}</strong>". <a href="#/">Clear filter</a></p>` : ''}
    <div class="project-list">${html || '<p>No projects match this tag.</p>'}</div>
  `;
}

// Listen to native URL hash changes
window.addEventListener('hashchange', router);

async function init() {
  try {
    allProjects = await loadProjects();
    router(); // Run on initial load
  } catch (err) {
    content.innerHTML = `<p class="error">Error loading projects: ${err.message}</p>`;
    console.error(err);
  }
}

init();
