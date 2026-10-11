import { createReadStream, stat } from 'node:fs';
import { createServer } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { ...securityHeaders, Allow: 'GET, HEAD' });
    return response.end();
  }
  const pathname = new URL(request.url, 'http://local').pathname;
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = normalize(resolve(root, relativePath));
  if (!file.startsWith(`${root}${sep}`) && file !== root) {
    response.writeHead(403, securityHeaders);
    return response.end('Forbidden');
  }
  stat(file, (error, details) => {
    if (error || !details.isFile()) {
      response.writeHead(404, securityHeaders);
      return response.end('Not found');
    }
    response.writeHead(200, {
      ...securityHeaders,
      'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
      'Cache-Control': file.endsWith('sw.js') ? 'no-cache' : 'no-store'
    });
    if (request.method === 'HEAD') return response.end();
    createReadStream(file).pipe(response);
  });
}).listen(port, host, () => console.log(`Pomodoro Focus: http://${host}:${port}`));
