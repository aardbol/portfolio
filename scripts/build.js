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
    const decoded = inner
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
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
  <title>${post.title} — aardbol.dev</title>
  <meta name="description" content="${post.summary}">
  <link rel="stylesheet" href="../../../css/style.css">
  <link rel="stylesheet" href="../../../css/hljs.css">
</head>
<body>
  <header>
    <nav class="site-nav">
      <a href="../../../">Projects</a>
      <a href="../../">Blog</a>
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
  <footer><p></p></footer>
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
