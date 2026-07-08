import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 8088);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
]);

function resolvePath(url) {
  const clean = decodeURIComponent(new URL(url, 'http://local').pathname);
  const rel = clean === '/' ? 'index.html' : clean.slice(1);
  const target = normalize(join(root, rel));
  return target.startsWith(root) ? target : join(root, 'index.html');
}

createServer((req, res) => {
  let target = resolvePath(req.url);
  if (!existsSync(target) || statSync(target).isDirectory()) target = join(root, 'index.html');
  res.setHeader('Content-Type', types.get(extname(target)) || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  createReadStream(target).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving dist on http://127.0.0.1:${port}/`);
});
