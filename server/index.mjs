import { createServer } from 'node:http';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectCategories } from '../src/data/projectCategories.ts';
import { seedMedia, seedProjects } from './seed.mjs';
import { loadConfig, projectRoot } from './config.mjs';
import { createEstimateService } from './support.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const passwordHash = (password, salt) => scryptSync(password, salt, 64, { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const categories = new Set(projectCategories.filter(item => item.slug).map(item => item.category));
const error = (status, message) => Object.assign(new Error(message), { status });
const SESSION_AGE = 8 * 60 * 60 * 1000;
const IDLE_AGE = 30 * 60 * 1000;

async function body(req, limit) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw error(413, '파일 또는 본문 용량이 너무 큽니다.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function jsonBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw error(415, 'JSON 형식이 필요합니다.');
  try { return JSON.parse((await body(req, 1024 * 1024)).toString('utf8')); }
  catch (cause) { if (cause.status) throw cause; throw error(400, '요청 형식이 올바르지 않습니다.'); }
}

function detectImage(bytes) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString())) return 'gif';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'webp';
  throw error(415, 'JPG, PNG, WebP, GIF 사진만 등록할 수 있습니다.');
}

export function createProjectServer({ dataDir, username, password, basePath = '/yeon-solution/', allowedOrigins = [], secureCookies = false, mail = {}, mailTransport }) {
  if (!username || typeof password !== 'string' || password.length < 12) throw new Error('관리자 비밀번호는 12자 이상이어야 합니다.');
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const uploadsDir = resolve(dataDir, 'uploads');
  mkdirSync(uploadsDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(resolve(dataDir, 'projects.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, data TEXT NOT NULL, sort_order INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admins (username TEXT PRIMARY KEY, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, csrf TEXT NOT NULL, expires_at INTEGER NOT NULL, last_seen INTEGER NOT NULL);`);
  if (!db.prepare('SELECT value FROM metadata WHERE key = ?').get('seeded')) {
    db.exec('BEGIN');
    try {
      seedProjects.forEach((post, index) => db.prepare('INSERT INTO posts VALUES (?, ?, ?)').run(post.id, JSON.stringify(post), -index));
      db.prepare('INSERT INTO metadata VALUES (?, ?)').run('seeded', '1');
      db.exec('COMMIT');
    } catch (cause) { db.exec('ROLLBACK'); throw cause; }
  }
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !timingSafeEqual(Buffer.from(admin.password_hash, 'hex'), passwordHash(password, admin.salt))) {
    const salt = randomBytes(24).toString('hex');
    db.prepare('INSERT OR REPLACE INTO admins VALUES (?, ?, ?)').run(username, salt, passwordHash(password, salt).toString('hex'));
    db.prepare('DELETE FROM sessions').run();
  }
  const attempts = new Map();
  const origins = new Set(allowedOrigins);
  const estimates = createEstimateService(mail, { transport: mailTransport });
  const cookieName = secureCookies ? '__Host-yeon_admin' : 'yeon_admin';
  const cookie = (token, age = 8 * 60 * 60) => `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secureCookies ? '; Secure' : ''}`;
  const send = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  const getPost = id => { const row = db.prepare('SELECT data FROM posts WHERE id = ?').get(id); return row ? JSON.parse(row.data) : undefined; };
  const mediaFile = path => {
    if (seedMedia.has(path)) return seedMedia.get(path);
    if (/^[a-f0-9-]{36}\.(jpg|png|webp|gif)$/.test(path)) return resolve(uploadsDir, path);
    return undefined;
  };
  const checkImage = image => {
    if (typeof image !== 'string' || !image.startsWith('/api/media/')) throw error(400, '등록된 사진을 선택해 주세요.');
    const file = mediaFile(image.slice('/api/media/'.length));
    if (!file || !existsSync(file)) throw error(400, '사진 파일을 찾을 수 없습니다.');
    return image;
  };
  const postImages = post => [post.image, ...post.blocks.filter(block => block.type === 'image').map(block => block.image)];
  const removeUnusedPhotos = post => {
    const referenced = new Set(db.prepare('SELECT data FROM posts').all().flatMap(row => postImages(JSON.parse(row.data))));
    for (const image of new Set(postImages(post))) {
      const name = image.slice('/api/media/'.length);
      if (referenced.has(image) || seedMedia.has(name)) continue;
      const file = mediaFile(name);
      if (file && existsSync(file)) {
        try { unlinkSync(file); } catch { console.warn('사용하지 않는 사진 정리를 완료하지 못했습니다.'); }
      }
    }
  };
  function validatePost(input) {
    if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120) throw error(400, '제목을 120자 이내로 입력해 주세요.');
    if (!categories.has(input.category)) throw error(400, '시공 분류를 선택해 주세요.');
    if (!Array.isArray(input.blocks) || !input.blocks.length || input.blocks.length > 100) throw error(400, '본문을 작성해 주세요. (최대 100개 문단·사진)');
    const blocks = input.blocks.map(block => {
      if (!block || typeof block.id !== 'string' || block.id.length > 100) throw error(400, '본문 형식을 확인해 주세요.');
      if (block.type === 'image') return { id: block.id, type: 'image', image: checkImage(block.image), caption: String(block.caption ?? '').slice(0, 300) };
      if (block.type !== 'text' || typeof block.text !== 'string' || block.text.length > 20000) throw error(400, '문단을 20,000자 이내로 입력해 주세요.');
      return { id: block.id, type: 'text', text: block.text, style: ['body', 'heading', 'quote'].includes(block.style) ? block.style : 'body', align: block.align === 'center' ? 'center' : 'left', bold: block.bold === true };
    });
    if (!blocks.some(block => block.type === 'image' || block.text.trim())) throw error(400, '본문을 작성해 주세요.');
    if (new Set(blocks.map(block => block.id)).size !== blocks.length) throw error(400, '문단 식별자가 중복되었습니다.');
    return { name: input.name.trim(), category: input.category, image: checkImage(input.image), blocks };
  }
  function session(req) {
    const raw = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!raw || !/^[a-f0-9]{64}$/.test(raw)) throw error(401, '관리자 로그인이 필요합니다.');
    const tokenHash = hash(raw);
    const current = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(tokenHash);
    if (!current || current.expires_at < Date.now() || current.last_seen < Date.now() - IDLE_AGE) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
      throw error(401, '로그인이 만료되었습니다. 다시 로그인해 주세요.');
    }
    db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').run(Date.now(), tokenHash);
    return current;
  }
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;
      const origin = req.headers.origin;
      if (path.startsWith('/api/')) {
        // Local-only by default; production origins must be configured explicitly.
        if (origin && !origins.has(origin)) throw error(403, '허용되지 않은 요청 출처입니다.');
        if (origin && origins.has(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Vary', 'Origin');
        }
        if (req.method === 'OPTIONS') {
          res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE', 'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token, X-Quote-Token', 'Access-Control-Max-Age': '600' });
          return res.end();
        }
        if (req.method === 'GET' && path === '/api/projects') {
          return send(res, 200, { projects: db.prepare('SELECT data FROM posts ORDER BY sort_order DESC').all().map(row => JSON.parse(row.data)) });
        }
        if (req.method === 'GET' && path === '/api/support/quote-token') {
          return send(res, 200, { token: estimates.issueToken() });
        }
        if (req.method === 'POST' && path === '/api/support/estimate') {
          if (!origin || !origins.has(origin)) throw error(403, '허용되지 않은 요청 출처입니다.');
          if (!req.headers['content-type']?.startsWith('application/json')) throw error(415, 'JSON 형식이 필요합니다.');
          let input;
          try { input = JSON.parse((await body(req, 32 * 1024)).toString('utf8')); }
          catch (cause) { if (cause.status) throw cause; throw error(400, '요청 형식이 올바르지 않습니다.'); }
          return send(res, 200, await estimates.submit(input, req.headers['x-quote-token'], req.socket.remoteAddress));
        }
        if (req.method === 'GET' && path.startsWith('/api/media/')) {
          const file = mediaFile(path.slice('/api/media/'.length));
          if (!file || !existsSync(file)) throw error(404, '사진을 찾을 수 없습니다.');
          res.writeHead(200, { 'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
          return res.end(await readFile(file));
        }
        if (req.method === 'POST' && path === '/api/admin/login') {
          const ip = req.socket.remoteAddress;
          const record = attempts.get(ip);
          if (record && record.until > Date.now() && record.count >= 5) throw error(429, '로그인 시도가 많습니다. 10분 뒤 다시 시도해 주세요.');
          const input = await jsonBody(req);
          if (!input || typeof input !== 'object' || Array.isArray(input)) throw error(400, '로그인 정보를 입력해 주세요.');
          const account = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
          const supplied = typeof input.password === 'string' && input.password.length <= 256 ? input.password : '';
          const matches = timingSafeEqual(Buffer.from(account.password_hash, 'hex'), passwordHash(supplied, account.salt));
          if (input.username !== username || !matches) {
            const previous = record?.until > Date.now() ? record.count : 0;
            attempts.set(ip, { count: previous + 1, until: Date.now() + 10 * 60 * 1000 });
            throw error(401, '아이디 또는 비밀번호가 올바르지 않습니다.');
          }
          attempts.delete(ip);
          // Rotate a previous session on each successful login.
          const previousCookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
          if (previousCookie) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash(previousCookie));
          db.prepare('DELETE FROM sessions WHERE expires_at < ? OR last_seen < ?').run(Date.now(), Date.now() - IDLE_AGE);
          const token = randomBytes(32).toString('hex');
          const csrfToken = randomBytes(32).toString('hex');
          db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)').run(hash(token), username, csrfToken, Date.now() + SESSION_AGE, Date.now());
          res.setHeader('Set-Cookie', cookie(token));
          return send(res, 200, { username, csrfToken });
        }
        const current = session(req);
        if (req.method === 'GET' && path === '/api/admin/session') return send(res, 200, { username: current.username, csrfToken: current.csrf });
        if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.headers['x-csrf-token'] !== current.csrf) throw error(403, '요청을 확인할 수 없습니다. 다시 로그인해 주세요.');
        if (req.method === 'POST' && path === '/api/admin/logout') {
          db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(current.token_hash);
          res.setHeader('Set-Cookie', cookie('', 0));
          return send(res, 200, { ok: true });
        }
        if (req.method === 'POST' && path === '/api/uploads') {
          if (!/^image\/(jpeg|png|webp|gif)$/.test(req.headers['content-type'] || '')) throw error(415, '사진 파일을 선택해 주세요.');
          const bytes = await body(req, 10 * 1024 * 1024);
          const extension = detectImage(bytes);
          const filename = `${randomUUID()}.${extension}`;
          writeFileSync(resolve(uploadsDir, filename), bytes, { flag: 'wx', mode: 0o600 });
          return send(res, 201, { image: `/api/media/${filename}` });
        }
        if (req.method === 'POST' && path === '/api/projects') {
          const post = { ...validatePost(await jsonBody(req)), id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          db.prepare('INSERT INTO posts VALUES (?, ?, ?)').run(post.id, JSON.stringify(post), Date.now());
          return send(res, 201, { project: post });
        }
        const match = /^\/api\/projects\/([a-zA-Z0-9-]+)$/.exec(path);
        if (match && req.method === 'PUT') {
          const existing = getPost(match[1]);
          if (!existing) throw error(404, '게시글을 찾을 수 없습니다.');
          const post = { ...existing, ...validatePost(await jsonBody(req)), updatedAt: new Date().toISOString() };
          db.prepare('UPDATE posts SET data = ? WHERE id = ?').run(JSON.stringify(post), post.id);
          removeUnusedPhotos(existing);
          return send(res, 200, { project: post });
        }
        if (match && req.method === 'DELETE') {
          const existing = getPost(match[1]);
          if (!existing) throw error(404, '게시글을 찾을 수 없습니다.');
          db.prepare('DELETE FROM posts WHERE id = ?').run(match[1]);
          removeUnusedPhotos(existing);
          return send(res, 200, { ok: true });
        }
        throw error(404, '요청한 기능을 찾을 수 없습니다.');
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw error(405, '허용되지 않은 요청입니다.');
      const dist = resolve(projectRoot, 'dist');
      const relative = decodeURIComponent(path.startsWith(basePath) ? path.slice(basePath.length) : path.slice(1));
      let file = resolve(dist, relative);
      if (!file.startsWith(`${dist}${sep}`) && file !== dist) throw error(404, '파일을 찾을 수 없습니다.');
      if (!existsSync(file) || statSync(file).isDirectory()) {
        if (extname(relative)) throw error(404, '파일을 찾을 수 없습니다.');
        file = resolve(dist, 'index.html');
      }
      if (!existsSync(file)) throw error(503, '먼저 npm run build를 실행해 주세요.');
      res.writeHead(200, { 'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream', 'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600' });
      res.end(req.method === 'HEAD' ? undefined : await readFile(file));
    } catch (cause) {
      if (!res.headersSent) send(res, cause.status || 500, { error: cause.status ? cause.message : '서버에서 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
      else res.end();
      if (!cause.status) console.error('Projects API:', cause.message);
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = loadConfig();
  const port = Number(process.env.PORT || 3001);
  createProjectServer(config).listen(port, process.env.HOST || '127.0.0.1', () => console.log(`연솔루션: http://127.0.0.1:${port}${config.basePath}`));
}
