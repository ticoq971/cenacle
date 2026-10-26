/* Cénacle : sauvegarde en ligne (Cloudflare Pages Functions + D1).
   Identité anonyme : le client génère une clé aléatoire de 128 bits (32 caractères hexadécimaux) et l'envoie dans l'en-tête
   « Authorization: Bearer <clé> » ; le serveur ne stocke que son empreinte SHA-256 (jamais la clé) et ne la journalise pas.
   GET    -> { exists, data, score, ver, updatedAt }
   PUT    -> { data: "<JSON de la partie>", score, ver, force? } ; refusé (409) si le score reçu est inférieur au score stocké, sauf force
   DELETE -> efface la ligne (remise à zéro voulue par le joueur)
   Pas de CORS : seules les requêtes de la même origine sont acceptées. */
const MAX_BODY = 300 * 1024, MAX_DATA = 256 * 1024, MIN_GAP = 2000;
const HDR = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (o, status, extra) => new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, HDR, extra || {}) });
async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

export async function onRequest(ctx) {
  const request = ctx.request, env = ctx.env, url = new URL(request.url), method = request.method;
  if (method !== 'GET' && method !== 'PUT' && method !== 'DELETE') return json({ error: 'method' }, 405, { Allow: 'GET, PUT, DELETE' });
  const origin = request.headers.get('Origin'); if (origin && origin !== url.origin) return json({ error: 'origin' }, 403);
  if (!env.DB) return json({ error: 'db' }, 503);
  const m = /^Bearer ([0-9a-f]{32})$/.exec(request.headers.get('Authorization') || ''); if (!m) return json({ error: 'auth' }, 401);
  const id = await sha256(m[1]);

  if (method === 'GET') {
    const row = await env.DB.prepare('SELECT data, score, ver, updated_at FROM saves WHERE id = ?1').bind(id).first();
    return row ? json({ exists: true, data: row.data, score: row.score, ver: row.ver, updatedAt: row.updated_at }) : json({ exists: false });
  }
  if (method === 'DELETE') { await env.DB.prepare('DELETE FROM saves WHERE id = ?1').bind(id).run(); return json({ ok: true }); }

  /* PUT */
  if ((request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase() !== 'application/json') return json({ error: 'type' }, 415);
  const cl = +request.headers.get('Content-Length'); if (cl > MAX_BODY) return json({ error: 'size' }, 413);
  const text = await request.text(); if (text.length > MAX_BODY) return json({ error: 'size' }, 413);
  let b; try { b = JSON.parse(text); } catch (e) { return json({ error: 'json' }, 400); }
  if (!b || typeof b !== 'object' || typeof b.data !== 'string' || typeof b.score !== 'number' || !isFinite(b.score) || b.score < 0 || b.score > 1e13) return json({ error: 'body' }, 400);
  if (new TextEncoder().encode(b.data).length > MAX_DATA) return json({ error: 'size' }, 413);
  let s; try { s = JSON.parse(b.data); } catch (e) { return json({ error: 'data' }, 400); }
  if (!s || typeof s !== 'object' || !Array.isArray(s.conv) || typeof s.ver !== 'number') return json({ error: 'data' }, 400);
  const ver = Math.max(0, Math.min(1000, Math.floor(+b.ver || s.ver || 0))), now = Date.now();
  const row = await env.DB.prepare('SELECT score, updated_at FROM saves WHERE id = ?1').bind(id).first();
  if (row) {
    if (now - row.updated_at < MIN_GAP) return json({ error: 'rate' }, 429, { 'Retry-After': '2' });
    if (!b.force && b.score < row.score) return json({ error: 'regression', score: row.score }, 409);
  }
  await env.DB.prepare('INSERT INTO saves (id, data, score, ver, updated_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(id) DO UPDATE SET data = excluded.data, score = excluded.score, ver = excluded.ver, updated_at = excluded.updated_at')
    .bind(id, b.data, b.score, ver, now).run();
  return json({ ok: true, updatedAt: now });
}
