// Usage: node scripts/check-post.mjs <path/to/post.md|mdx>
// Static checks for a blog post. Exits 1 if any ERROR is found; WARNs are advisory.
import { access, readdir, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('Usage: node scripts/check-post.mjs <post file>');
  process.exit(1);
}

const problems = [];
const err = (m) => problems.push(['ERROR', m]);
const warn = (m) => problems.push(['WARN', m]);
const exists = (p) =>
  access(p).then(
    () => true,
    () => false
  );

const src = await readFile(file, 'utf8');
const fm = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
if (!fm) {
  err('No frontmatter block found');
  report();
}
const [, head, body] = fm;
const field = (re) => head.match(re)?.[1]?.trim();
const unquote = (s) => s?.replace(/^(['"])([\s\S]*)\1$/, '$2');

// --- filename ---
const name = basename(file, extname(file));
if (!/^post-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/.test(name))
  err(`Filename "${name}" should look like post-NN-kebab-title`);
const postNum = Number(name.match(/^post-(\d+)/)?.[1]);

// --- frontmatter ---
if (field(/^layout:\s*(.+)$/m) !== '../../layouts/MarkdownPostLayout.astro')
  err('layout must be ../../layouts/MarkdownPostLayout.astro');
const title = unquote(field(/^title:\s*(.+)$/m));
if (!title) err('Missing title');
const pubDate = field(/^pubDate:\s*(.+)$/m);
if (!/^\d{4}-\d{2}-\d{2}$/.test(pubDate ?? ''))
  err(`pubDate must be YYYY-MM-DD (got "${pubDate}")`);
const desc = unquote(field(/^description:\s*(.+)$/m));
if (!desc) err('Missing description');
else if (desc.length < 60 || desc.length > 300)
  warn(`description is ${desc.length} chars (aim for 60–300)`);
if (!field(/^author:\s*(.+)$/m)) err('Missing author');
const type = field(/^type:\s*(.+)$/m);
if (!['quest', 'spellbook', 'lore', 'character'].includes(type))
  err(`type must be quest|spellbook|lore|character (got "${type}")`);

const tagsRaw = field(/^tags:\s*\[(.*)\]\s*$/m);
if (tagsRaw === undefined) err("tags must be an inline list: tags: ['a', 'b']");
else {
  const tags = tagsRaw
    .split(',')
    .map((t) => unquote(t.trim()))
    .filter(Boolean);
  if (!tags.length) err('tags is empty');
  for (const t of tags)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t)) err(`tag "${t}" must be lowercase-hyphenated`);
  const postsDir = join(root, 'src/pages/posts');
  const known = new Set();
  for (const f of await readdir(postsDir)) {
    if (join(postsDir, f) === file) continue;
    const m = (await readFile(join(postsDir, f), 'utf8')).match(/^tags:\s*\[(.*)\]/m);
    m?.[1].split(',').forEach((t) => known.add(unquote(t.trim())));
  }
  const fresh = tags.filter((t) => !known.has(t));
  if (fresh.length)
    warn(`new tags (intended?): ${fresh.join(', ')} — existing: ${[...known].sort().join(', ')}`);
}

// --- hero image ---
const heroUrl = field(/^ {2}url:\s*(.+)$/m);
const heroAlt = unquote(field(/^ {2}alt:\s*(.+)$/m));
if (!heroUrl) err('Missing image.url');
if (!heroAlt) err('Missing image.alt (required for og:image:alt)');
if (!field(/^ {2}width:\s*(\d+)/m) || !field(/^ {2}height:\s*(\d+)/m))
  err('image.width/height missing');

// --- images ---
const imgPaths = new Set(heroUrl ? [unquote(heroUrl)] : []);
for (const tag of body.matchAll(/<img\b[^>]*>/g)) {
  const t = tag[0];
  const s = t.match(/src=["']([^"']+)["']/)?.[1];
  if (s) imgPaths.add(s);
  if (!/\balt=/.test(t)) err(`<img> without alt: ${s}`);
  else if (/\balt=["']\s*["']/.test(t)) warn(`<img> with empty alt (decorative?): ${s}`);
  if (!/\bwidth=/.test(t) || !/\bheight=/.test(t))
    warn(`<img> missing width/height (layout shift): ${s}`);
}
for (const m of body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)) {
  imgPaths.add(m[2]);
  if (!m[1].trim()) warn(`markdown image with empty alt: ${m[2]}`);
}
for (const p of imgPaths) {
  if (/^https?:/.test(p)) {
    warn(`remote image (prefer local WebP): ${p}`);
    continue;
  }
  if (!p.startsWith('/images/compressed/')) warn(`image outside /images/compressed/: ${p}`);
  else if (postNum && !p.startsWith(`/images/compressed/post${postNum}/`))
    warn(`image not in post${postNum}/ folder: ${p}`);
  if (!p.endsWith('.webp')) warn(`image is not WebP: ${p}`);
  if (!(await exists(join(root, 'public', p)))) err(`image file missing: public${p}`);
}

// --- headings (ignore fenced code) ---
const prose = body.replace(/```[\s\S]*?```/g, '');
const heads = [...prose.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => ({
  level: m[1].length,
  text: m[2].trim(),
}));
const h1s = heads.filter((h) => h.level === 1);
if (h1s.length !== 1) err(`expected exactly one H1, found ${h1s.length}`);
else if (title && h1s[0].text !== title) warn('H1 text differs from frontmatter title');
let prev = 0;
for (const h of heads) {
  if (prev && h.level > prev + 1)
    err(`heading skips a level: "${h.text}" (h${prev} → h${h.level})`);
  prev = h.level;
}

// --- links ---
for (const m of prose.matchAll(/\[([^\]]*)\]\(([^)\s]*)\)/g)) {
  if (!m[1].trim() && !prose.slice(m.index - 1, m.index).includes('!'))
    err(`link with no text: ${m[2]}`);
  if (/^(here|click here|link|this)$/i.test(m[1].trim()))
    warn(`non-descriptive link text "${m[1]}" → ${m[2]}`);
  if (!m[2] || m[2] === '#') err(`empty link target for "${m[1]}"`);
}
if (/\b(TODO|FIXME|XXX|lorem ipsum)\b/i.test(body)) warn('leftover TODO/FIXME/placeholder text');
let inFence = false;
for (const line of body.split('\n')) {
  if (!/^\s*```/.test(line)) continue;
  if (!inFence && /^\s*```\s*$/.test(line)) {
    warn('code fence without a language');
    break;
  }
  inFence = !inFence;
}

// --- stray originals ---
if (/\.(png|jpe?g|gif|heic)["')]/i.test(body)) warn('body references a non-WebP image extension');

report();

function report() {
  for (const [lvl, m] of problems) console.log(`${lvl}: ${m}`);
  const errors = problems.filter(([l]) => l === 'ERROR').length;
  console.log(`\n${basename(file)}: ${errors} error(s), ${problems.length - errors} warning(s)`);
  process.exit(errors ? 1 : 0);
}
