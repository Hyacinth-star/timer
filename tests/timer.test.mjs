import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatTime, nextMode, progressFor } from '../dist/timer-core.js';

test('formats countdown time', () => {
  assert.equal(formatTime(1500), '25:00');
  assert.equal(formatTime(1), '00:01');
  assert.equal(formatTime(0), '00:00');
});

test('cycles focus to the correct type of break', () => {
  assert.equal(nextMode('focus', 1), 'short');
  assert.equal(nextMode('focus', 4), 'long');
  assert.equal(nextMode('short', 4), 'focus');
});

test('clamps progress to a valid range', () => {
  assert.equal(progressFor(1500, 1500), 0);
  assert.equal(progressFor(750, 1500), 0.5);
  assert.equal(progressFor(-1, 1500), 1);
});

test('includes a standalone PWA manifest for mobile installation', async () => {
  const manifest = JSON.parse(await readFile(new URL('../dist/manifest.webmanifest', import.meta.url)));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.short_name, 'Pomodoro');
  assert.ok(manifest.icons.length > 0);
});

test('declares a restrictive content policy and local server security headers', async () => {
  const [page, server] = await Promise.all([
    readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../server.mjs', import.meta.url), 'utf8')
  ]);
  assert.match(page, /Content-Security-Policy/);
  assert.match(page, /default-src 'self'/);
  for (const header of ['X-Content-Type-Options', 'Permissions-Policy', 'X-Frame-Options', 'Referrer-Policy']) {
    assert.match(server, new RegExp(header));
  }
});
