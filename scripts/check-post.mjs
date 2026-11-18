// Usage: node scripts/check-post.mjs <path/to/post.md|mdx>
// Static checks for a blog post. Exits 1 if any ERROR is found; WARNs are advisory
// and NOTEs are prompts to confirm something is intended.
import { execFileSync } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('Usage: node scripts/check-post.mjs <post file>');
  process.exit(1);
}

const problems = [];
const err = (m) => problems.push(['ERROR', m]);
const warn = (m) => problems.push(['WARN', m]);
const note = (m) => problems.push(['NOTE', m]);
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
// What each <img> claims its size is, to compare against the real file.
const declared = new Map();
if (heroUrl) {
  declared.set(unquote(heroUrl), [
    Number(field(/^ {2}width:\s*(\d+)/m)),
    Number(field(/^ {2}height:\s*(\d+)/m)),
  ]);
}
for (const tag of body.matchAll(/<img\b[^>]*>/g)) {
  const t = tag[0];
  const s = t.match(/src=["']([^"']+)["']/)?.[1];
  if (s) imgPaths.add(s);
  const w = Number(t.match(/\bwidth=["']?(\d+)/)?.[1]);
  const h = Number(t.match(/\bheight=["']?(\d+)/)?.[1]);
  if (s && w && h) declared.set(s, [w, h]);
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
  if (!(await exists(join(root, 'public', p)))) {
    err(`image file missing: public${p}`);
    continue;
  }

  const meta = await sharp(join(root, 'public', p)).metadata();
  const isHero = p === unquote(heroUrl);
  const [dw, dh] = declared.get(p) ?? [];
  if (dw && dh && Math.abs(dh / dw - meta.height / meta.width) > 0.02)
    warn(
      `${p}: declared ${dw}×${dh} doesn't match the file's ${meta.width}×${meta.height} aspect ratio`
    );
  if (isHero && meta.height / meta.width > 0.76)
    warn(
      `hero ${p} is ${meta.width}×${meta.height}, taller than 4:3. The page caps it, but social ` +
        `cards crop tall images and the text inside is unreadable at hero size. Prefer landscape`
    );
  // The post column is ~735px wide on desktop; a narrower file is stretched and goes soft.
  if (!isHero && meta.width < 735)
    warn(
      `${p} is only ${meta.width}px wide but displays up to 735px: it will look soft. Export at 2x`
    );
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
// A link to a private repo is a 404 for every reader. Needs the gh CLI; skipped without it.
const repos = new Set(
  [...prose.matchAll(/https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)/g)].map((m) => `${m[1]}/${m[2]}`)
);
for (const repo of repos) {
  try {
    const priv = execFileSync('gh', ['api', `repos/${repo}`, '--jq', '.private'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (priv === 'true') err(`links to github.com/${repo}, which is private (404 for readers)`);
  } catch (e) {
    const out = `${e.stderr ?? ''}${e.message ?? ''}`;
    if (/HTTP 404/.test(out)) err(`links to github.com/${repo}, which is private or doesn't exist`);
    // gh missing or not logged in: can't tell, so say nothing
  }
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

// --- series ---
const series = JSON.parse(await readFile(join(root, 'src/data/series.json'), 'utf8'));
const memberOf = Object.entries(series).filter(([, s]) => s.posts.includes(name));
if (!memberOf.length) {
  note(
    `not in any series. If it continues one, add "${name}" to src/data/series.json: ` +
      Object.entries(series)
        .map(([slug, s]) => `${slug} ("${s.title}")`)
        .join(', ')
  );
}

report();

function report() {
  for (const [lvl, m] of problems) console.log(`${lvl}: ${m}`);
  const errors = problems.filter(([l]) => l === 'ERROR').length;
  const warnings = problems.filter(([l]) => l === 'WARN').length;
  const notes = problems.length - errors - warnings;
  console.log(
    `\n${basename(file)}: ${errors} error(s), ${warnings} warning(s)${notes ? `, ${notes} note(s)` : ''}`
  );
  process.exit(errors ? 1 : 0);
}
