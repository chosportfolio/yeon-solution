import { createServer } from 'vite';
import { createProjectServer } from '../server/index.mjs';
import { loadConfig } from '../server/config.mjs';

const config = loadConfig();
const api = createProjectServer(config);
await new Promise((resolve, reject) => {
  api.once('error', reject);
  api.listen(3001, '127.0.0.1', resolve);
});
const vite = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: true } });
await vite.listen();
vite.printUrls();
const close = async () => { await vite.close(); api.close(); };
process.once('SIGINT', close);
process.once('SIGTERM', close);
