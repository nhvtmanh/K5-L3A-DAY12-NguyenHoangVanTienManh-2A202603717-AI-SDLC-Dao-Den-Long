import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const baseURL = 'http://127.0.0.1:4179';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4179', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '', browser;
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });
const errors = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview failed: ${serverLog}`);
    try { ready = (await fetch(baseURL)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Preview not ready: ${serverLog}`);
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome', headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL);
  await page.waitForFunction(() => document.querySelector('#hud')?.textContent.includes('Đèn: 0/5'));
  await page.waitForTimeout(300);
  mkdirSync('docs/proof/phase-1', { recursive: true });
  await page.screenshot({ path: 'docs/proof/phase-1/game-start.png' });
  await page.mouse.move(850, 400);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(1050, 450, { steps: 10 });
  await page.mouse.up({ button: 'right' });
  await page.keyboard.down('KeyD'); await page.waitForTimeout(300); await page.keyboard.up('KeyD');
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'docs/proof/phase-1/game-camera.png' });
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('hết ánh lửa'), null, { timeout: 45000 });
  const lost = await page.locator('#status').textContent();
  await page.screenshot({ path: 'docs/proof/phase-1/game-lost.png' });
  await page.getByRole('button', { name: 'Chơi lại' }).click();
  await page.waitForFunction(() => document.querySelector('#hud').textContent.includes('Máu: 3') && document.querySelector('#hud').textContent.includes('Điểm: 0'));
  await page.screenshot({ path: 'docs/proof/phase-1/game-restart.png' });
  assert.deepEqual(errors, [], 'Browser page errors');
  const result = { browser: await browser.version(), url: baseURL, viewport: '1280x800',
    passed: ['built game loads WebGL', 'mouse drag and keyboard smoke', 'idle game reaches loss', 'restart resets HUD'],
    lost_message: lost, page_errors: errors,
    limits: 'Human confirmation plus mathematical projection tests cover control direction; no automated pointer-lock assertion or browser win run.' };
  writeFileSync('docs/proof/phase-1/browser.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally { await browser?.close(); server.kill(); }
