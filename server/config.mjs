import { appendFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadMailConfig } from './support.mjs';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export function loadConfig() {
  const envPath = fileURLToPath(new URL('../.env.local', import.meta.url));
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  const additions = [];
  if (!process.env.PROJECTS_ADMIN_USERNAME) {
    process.env.PROJECTS_ADMIN_USERNAME = 'admin';
    additions.push('PROJECTS_ADMIN_USERNAME=admin');
  }
  if (!process.env.PROJECTS_ADMIN_PASSWORD) {
    if (process.env.NODE_ENV === 'production') throw new Error('운영 환경의 관리자 비밀번호를 설정해 주세요.');
    process.env.PROJECTS_ADMIN_PASSWORD = randomBytes(18).toString('base64url');
    additions.push(`PROJECTS_ADMIN_PASSWORD=${process.env.PROJECTS_ADMIN_PASSWORD}`);
  }
  if (additions.length) {
    appendFileSync(envPath, `\n# Local administrator (never commit this file)\n${additions.join('\n')}\n`, { mode: 0o600 });
    console.log('임시 관리자 계정을 .env.local에 생성했습니다.');
  }
  return {
    username: process.env.PROJECTS_ADMIN_USERNAME,
    password: process.env.PROJECTS_ADMIN_PASSWORD,
    dataDir: process.env.PROJECTS_DATA_DIR || fileURLToPath(new URL('../.local-data/', import.meta.url)),
    basePath: '/yeon-solution/',
    allowedOrigins: (process.env.PROJECTS_ALLOWED_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3001,http://localhost:3001').split(',').map(value => value.trim()),
    secureCookies: process.env.NODE_ENV === 'production',
    mail: loadMailConfig(),
  };
}
