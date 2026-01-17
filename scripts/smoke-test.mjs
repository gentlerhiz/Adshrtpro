#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

function log(name, ok, info) {
  console.log(`\n==== ${name} ====`);
  console.log(ok ? 'OK' : 'FAIL', info || '');
}

async function safeJson(res) {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

async function run() {
  console.log('Running smoke tests against', BASE);

  // 1) GET /api/blog
  try {
    const res = await fetch(`${BASE}/api/blog`);
    const body = await safeJson(res);
    log('GET /api/blog', res.ok, { status: res.status, body });
  } catch (e) { log('GET /api/blog', false, e); }

  // 2) Register
  const email = `smoke+${Date.now()}@example.com`;
  const password = 'Sm0keTest!';
  let token = null;
  let user = null;
  try {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, telegramUsername: '' }),
    });
    const body = await safeJson(res);
    log('POST /api/auth/register', res.ok, { status: res.status, body });
    if (res.ok && body.token) { token = body.token; user = body.user; }
  } catch (e) { log('POST /api/auth/register', false, e); }

  // 3) Login
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await safeJson(res);
    log('POST /api/auth/login', res.ok, { status: res.status, body });
    if (res.ok && body.token && !token) token = body.token;
  } catch (e) { log('POST /api/auth/login', false, e); }

  if (!token) {
    console.error('No token available; aborting authenticated tests');
    process.exit(1);
  }

  // 4) GET /api/auth/me
  try {
    const res = await fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await safeJson(res);
    log('GET /api/auth/me', res.ok, { status: res.status, body });
  } catch (e) { log('GET /api/auth/me', false, e); }

  // 5) Create link
  let link = null;
  try {
    const res = await fetch(`${BASE}/api/links`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ originalUrl: 'https://example.com', shortCode: `SMOKE${Date.now().toString().slice(-6)}` }),
    });
    const body = await safeJson(res);
    log('POST /api/links', res.ok, { status: res.status, body });
    if (res.ok) link = body;
  } catch (e) { log('POST /api/links', false, e); }

  if (!link || !link.shortCode) {
    console.error('Link creation failed; aborting redirect/analytics tests');
    process.exit(1);
  }

  // 6) Follow short link (expect 302 redirect)
  try {
    const res = await fetch(`${BASE}/${link.shortCode}`, { redirect: 'manual' });
    log(`GET /${link.shortCode}`, res.status === 302, { status: res.status, location: res.headers.get('location') });
  } catch (e) { log(`GET /${link.shortCode}`, false, e); }

  // 7) Unlock analytics
  try {
    const res = await fetch(`${BASE}/api/analytics/unlock`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ linkId: link.id }),
    });
    const body = await safeJson(res);
    log('POST /api/analytics/unlock', res.ok, { status: res.status, body });
  } catch (e) { log('POST /api/analytics/unlock', false, e); }

  // 8) Unlock status
  try {
    const res = await fetch(`${BASE}/api/analytics/${link.id}/unlock-status`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await safeJson(res);
    log(`GET /api/analytics/${link.id}/unlock-status`, res.ok, { status: res.status, body });
  } catch (e) { log(`GET /api/analytics/${link.id}/unlock-status`, false, e); }

  console.log('\nSmoke tests complete');
}

run().catch(err => { console.error('Smoke test runner error:', err); process.exit(2); });
