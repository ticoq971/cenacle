/* Cénacle : boutique de ressources payée avec Stripe Checkout (Cloudflare Pages Functions + D1).
   Aucun prix n'est lu côté client : le catalogue ci-dessous est la seule source des montants.
   Secret requis (Cloudflare > Pages > cenacle > Settings > Variables and Secrets) : STRIPE_SECRET_KEY (clé secrète sk_live_… ou sk_test_…).
   Même identité anonyme que /api/save : « Authorization: Bearer <clé 32 hex> » ; le serveur ne garde que SHA-256 de la clé.
   GET  ?status           -> { ready: bool, packs: [{ id, cents }] }
   POST { pack }          -> crée une session Stripe Checkout, répond { url, session }
   GET  ?session=cs_…     -> vérifie le paiement auprès de Stripe ; { paid, pack, again } (again = déjà réclamée avant)
   Le client dédouble l'attribution grâce à l'identifiant de session conservé dans sa sauvegarde. */
const PACKS = {
  p1: { cents: 199, name: 'Bourse du pèlerin' },
  p2: { cents: 499, name: 'Coffre du marchand' },
  p3: { cents: 999, name: 'Trésor du Cénacle' },
};
const HDR = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, HDR) });
async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const stripe = (env, path, body) => fetch('https://api.stripe.com/v1/' + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY }, body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), body: body ? new URLSearchParams(body).toString() : undefined });

export async function onRequest(ctx) {
  const request = ctx.request, env = ctx.env, url = new URL(request.url), method = request.method;
  if (method !== 'GET' && method !== 'POST') return json({ error: 'method' }, 405);
  const origin = request.headers.get('Origin'); if (origin && origin !== url.origin) return json({ error: 'origin' }, 403);
  const ready = !!(env.STRIPE_SECRET_KEY && env.DB);
  if (method === 'GET' && url.searchParams.has('status')) return json({ ready, packs: Object.keys(PACKS).map(k => ({ id: k, cents: PACKS[k].cents })) });
  if (!ready) return json({ error: 'not_configured' }, 503);
  const m = /^Bearer ([0-9a-f]{32})$/.exec(request.headers.get('Authorization') || ''); if (!m) return json({ error: 'auth' }, 401);
  const id = await sha256(m[1]);

  if (method === 'POST') {
    let b; try { b = await request.json(); } catch (e) { return json({ error: 'json' }, 400); }
    const P = b && PACKS[b.pack]; if (!P) return json({ error: 'pack' }, 400);
    const r = await stripe(env, 'checkout/sessions', {
      mode: 'payment', 'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': 'eur', 'line_items[0][price_data][unit_amount]': String(P.cents),
      'line_items[0][price_data][product_data][name]': P.name + ' · Cénacle', 'metadata[h]': id, 'metadata[pack]': b.pack,
    });
    const j = await r.json().catch(() => null); if (!r.ok || !j || !j.url) return json({ error: 'stripe' }, 502);
    return json({ url: j.url, session: j.id });
  }

  const sid = url.searchParams.get('session'); if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sid || '')) return json({ error: 'session' }, 400);
  const r = await stripe(env, 'checkout/sessions/' + encodeURIComponent(sid)); const s = await r.json().catch(() => null);
  if (!r.ok || !s) return json({ error: 'stripe' }, 502);
  if (s.payment_status !== 'paid' || !s.metadata || s.metadata.h !== id || !PACKS[s.metadata.pack]) return json({ paid: false });
  const ins = await env.DB.prepare('INSERT OR IGNORE INTO purchases (session_id, id, pack, amount, created_at) VALUES (?1, ?2, ?3, ?4, ?5)').bind(sid, id, s.metadata.pack, +s.amount_total || 0, Date.now()).run();
  return json({ paid: true, pack: s.metadata.pack, again: !(ins.meta && ins.meta.changes > 0) });
}
