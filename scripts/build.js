import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let hljs;
try {
  hljs = (await import('highlight.js')).default;
} catch {
  console.warn('highlight.js not found — code blocks will not be highlighted. Run: npm install');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function buildPage(templatePath, outputPath, data) {
  let html = readFileSync(resolve(root, templatePath), 'utf-8');
  for (const [marker, content] of Object.entries(data)) {
    html = html.replace(marker, content);
  }
  writeFileSync(resolve(root, outputPath), html);
}

function projectCards(projects) {
  return projects.map(p => {
    const tagPills = p.tags.map(t => `<span class="tag-pill">${t}</span>`).join(' ');
    return [
      `  <article class="project-card" data-tags="${p.tags.join(',')}">`,
      `    <header class="project-header">`,
      `      <h2><a href="${p.url}" target="_blank" rel="noopener">${p.title}</a></h2>`,
      `      <time>${p.date}</time>`,
      `    </header>`,
      `    <p>${p.summary}</p>`,
      `    <div class="tags">${tagPills}</div>`,
      `  </article>`,
    ].join('\n');
  }).join('\n');
}

function blogPostCards(posts) {
  return posts.map(p => {
    const tagPills = p.tags.map(t => `<span class="tag-pill">${t}</span>`).join(' ');
    return [
      `  <article class="blog-post" data-tags="${p.tags.join(',')}">`,
      `    <header class="blog-post-header">`,
      `      <time>${p.date}</time>`,
      `      <span class="blog-post-sep">&middot;</span>`,
      `      <h2><a href="posts/${p.slug}/">${p.title}</a></h2>`,
      `    </header>`,
      `    <p>${p.summary}</p>`,
      `    <div class="tags">${tagPills}</div>`,
      `  </article>`,
    ].join('\n');
  }).join('\n');
}

function highlightContent(html) {
  if (!hljs) return html;
  return html.replace(/<pre lang="(\w+)">(.*?)<\/pre>/gs, (_, lang, inner) => {
    const decoded = inner.replace(/&(?:amp|lt|gt|quot|#39);/g, m => {
      switch (m) {
        case '&amp;': return '&';
        case '&lt;': return '<';
        case '&gt;': return '>';
        case '&quot;': return '"';
        case '&#39;': return "'";
        default: return m;
      }
    });
    let result;
    try {
      result = hljs.highlight(decoded, { language: lang });
    } catch {
      result = hljs.highlightAuto(decoded);
    }
    return `<pre><code class="hljs language-${result.language}">${result.value}</code></pre>`;
  });
}

function buildPostPage(post) {
  const dir = resolve(root, 'blog', 'posts', post.slug);
  mkdirSync(dir, { recursive: true });

  const tagLinks = post.tags.map(t =>
    `<a href="../../#/tag/${encodeURIComponent(t)}" class="tag-pill">${t}</a>`
  ).join(' ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>(function(){var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}else{var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light')}})()</script>
  <title>${post.title} — aardbol.dev</title>
  <meta name="description" content="${post.summary}">
  <link rel="stylesheet" href="../../../css/style.css">
  <link rel="stylesheet" href="../../../css/hljs.css" id="hljs-theme">
  <script>(function(){var d=document.documentElement.getAttribute('data-theme');if(d!=='dark'){var l=document.getElementById('hljs-theme');if(l)l.setAttribute('href',l.getAttribute('href').replace('hljs.css','hljs-light.css'))}})()</script>
</head>
<body>
  <header>
    <nav class="site-nav">
      <a href="../../../">Projects</a>
      <a href="../../" class="active">Blog</a>
      <button class="theme-toggle" aria-label="Toggle theme"></button>
    </nav>
    <h1>${post.title}</h1>
    <time>${post.date}</time>
  </header>
  <main>
    <div class="blog-content">
${highlightContent(post.content)}
    </div>
    <div class="tags">${tagLinks}</div>
    <nav class="back-link">
      <a href="../../">← Back to blog</a>
    </nav>
  </main>
  <footer><p><a href="https://github.com/aardbol" target="_blank" rel="noopener" class="icon-link"><svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>github.com/aardbol</a></p></footer>
  <script src="../../../js/theme.js"></script>
</body>
</html>`;

  writeFileSync(resolve(dir, 'index.html'), html);
}

// Projects
const projects = JSON.parse(readFileSync(resolve(root, 'data/projects.json'), 'utf-8'));
projects.sort((a, b) => b.date.localeCompare(a.date));
buildPage('index.html.tmpl', 'index.html', {
  '<!-- BUILD_PROJECTS -->': projectCards(projects),
  '<!-- BUILD_DATA -->': JSON.stringify(projects),
});
console.log(`Built index.html with ${projects.length} project${projects.length !== 1 ? 's' : ''}.`);

// Blog index + individual posts
const posts = JSON.parse(readFileSync(resolve(root, 'data/blog.json'), 'utf-8'));
posts.sort((a, b) => b.date.localeCompare(a.date));
buildPage('blog/index.html.tmpl', 'blog/index.html', {
  '<!-- BUILD_POSTS -->': blogPostCards(posts),
  '<!-- BUILD_DATA -->': JSON.stringify(posts),
});
for (const post of posts) {
  buildPostPage(post);
}
console.log(`Built blog/index.html and ${posts.length} post page${posts.length !== 1 ? 's' : ''}.`);
