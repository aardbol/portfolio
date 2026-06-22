const content = document.getElementById('content');
const tagCloud = document.getElementById('tag-cloud');
let activeTag = null;
let allPosts = [];

function loadPosts() {
  const el = document.getElementById('blog-data');
  if (!el) throw new Error('No embedded blog data found');
  return JSON.parse(el.textContent);
}

function router() {
  let hash = location.hash.slice(1);
  if (hash.startsWith('/')) hash = hash.slice(1);

  if (hash === '' || hash.startsWith('tag/')) {
    if (hash.startsWith('tag/')) {
      activeTag = decodeURIComponent(hash.split('/')[1]);
    } else {
      activeTag = null;
    }
    buildTagCloud();
    filterPosts();
  } else {
    content.innerHTML = '<p>Page not found.</p>';
  }
}

function buildTagCloud() {
  const counts = {};
  allPosts.forEach(p => p.tags.forEach(t => {
    counts[t] = (counts[t] || 0) + 1;
  }));

  const maxCount = Math.max(...Object.values(counts));
  const minCount = Math.min(...Object.values(counts));
  const sortedTags = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const { h, s } = window.__theme.getAccentHSL();

  const tagsHtml = sortedTags.map(([tag, count]) => {
    const rank = minCount === maxCount ? 0.5 : (count - minCount) / (maxCount - minCount);
    const size = 0.8 + rank * 0.55;
    const bgAlpha = (0.04 + rank * 0.18).toFixed(2);
    const lum = Math.round(88 - rank * 15);

    const isActive = tag === activeTag;
    const targetHash = isActive ? '#/' : `#/tag/${encodeURIComponent(tag)}`;
    const inlineStyle = isActive
      ? `font-size:${size.toFixed(2)}rem`
      : `font-size:${size.toFixed(2)}rem;background:hsl(${h},${s}%,${(88 - rank * 10).toFixed(0)}%,${bgAlpha});color:hsl(${h},${s}%,${lum}%)`;

    return `<a href="${targetHash}" class="tag${isActive ? ' active' : ''}" style="${inlineStyle}" title="${count} post${count > 1 ? 's' : ''}">${tag}</a>`;
  }).join('');

  tagCloud.innerHTML = `
    <div class="tag-label">Filter by tag</div>
    <div class="cloud-tags">
      ${tagsHtml}
    </div>
  `;
}

function filterPosts() {
  const notice = document.getElementById('filter-notice');
  if (notice) notice.remove();

  const posts = content.querySelectorAll('.blog-post');
  let visible = 0;

  posts.forEach(post => {
    if (activeTag) {
      const tags = post.dataset.tags.split(',');
      if (tags.includes(activeTag)) {
        post.classList.remove('hidden');
        visible++;
      } else {
        post.classList.add('hidden');
      }
    } else {
      post.classList.remove('hidden');
    }
  });

  if (activeTag) {
    const div = document.createElement('div');
    div.id = 'filter-notice';
    div.className = 'filter-notice';
    div.innerHTML = `Showing posts tagged "<strong>${activeTag}</strong>". <a href="#/">Clear filter</a>`;
    content.insertBefore(div, content.firstChild);
  }

  document.getElementById('no-match')?.remove();

  if (activeTag && visible === 0) {
    const noMatch = document.createElement('p');
    noMatch.id = 'no-match';
    noMatch.textContent = 'No posts match this tag.';
    content.querySelector('.blog-list').appendChild(noMatch);
  }
}

window.addEventListener('hashchange', router);

async function init() {
  try {
    allPosts = loadPosts();
    router();
  } catch (err) {
    content.innerHTML = `<p class="error">Error loading blog: ${err.message}</p>`;
    console.error(err);
  }
}

window.addEventListener('themechange', () => buildTagCloud());

init();
