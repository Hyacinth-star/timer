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
