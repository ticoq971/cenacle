/* Verification du pre-calcul (bake) : empreintes profondes de l'etat global du jeu.
   Usage dev : injecter ce fichier AVANT le chargement de la page (CDP Page.addScriptToEvaluateOnNewDocument, ou coller dans la console puis recharger n'est PAS possible),
   puis lire window.BAKEHASH[etiquette] = { nom : [hash, noeuds] } aux points de controle 'pre' (avant planInit), 'plan' (juste apres), 'built' (fin de buildWorld).
   Les couleurs de sommet du decor sont tirees au hasard par Batch.add (Math.random) : ignorees sauf pour le terrain (attribut pav). Les noms a hacher : window.__NAMES (liste), sinon la liste ci-dessous. Compare deux demarrages : calcul complet (?nobake) contre relecture du pre-calcul. */
(function () {
  const F64 = new Float64Array(1), U32 = new Uint32Array(F64.buffer);
  function hasher() {
    let h1 = 0x9e3779b9 | 0, h2 = 0x85ebca6b | 0, n = 0;
    const p = x => { h1 = Math.imul(h1 ^ x, 2654435761); h1 = (h1 << 13) | (h1 >>> 19); h2 = Math.imul(h2 ^ x, 1597334677); h2 = (h2 << 7) | (h2 >>> 25); h2 ^= h1; };
    return {
      p, n: () => n, tick: () => ++n,
      num(v) { F64[0] = v; p(U32[0]); p(U32[1]); },
      str(s) { p(s.length); for (let i = 0; i < s.length; i++) p(s.charCodeAt(i)); },
      bytes(ta) { const L = ta.byteLength; p(L); if (L % 4 === 0 && ta.byteOffset % 4 === 0) { const w = new Uint32Array(ta.buffer, ta.byteOffset, L / 4); for (let i = 0; i < w.length; i++) p(w[i]); } else { const b = new Uint8Array(ta.buffer, ta.byteOffset, L); for (let i = 0; i < L; i++) p(b[i]); } },
      done() { return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'); }
    };
  }
  const SKIP = /^(Window|HTMLElement|HTML\w*Element|SVG\w*Element|Document|Node|Text|CanvasRenderingContext2D|WebGL\w*|AudioContext|AudioNode|GainNode|OscillatorNode|AudioBuffer|Worker|Promise|Blob|Event|CSSStyleDeclaration|Storage|IDB\w*|XMLHttpRequest|RTCPeerConnection|MediaStream|DOMRect|Image|ImageData|OffscreenCanvas|ResizeObserver|IntersectionObserver|MutationObserver|WebSocket|MessageChannel|AbortController)$/;
  function deep(root, opt) {
    opt = opt || {}; const H = hasher(), seen = new Map(); let truncated = false;
    const LIM = opt.limit || 4e7;
    (function w(v) {
      if (H.n() > LIM) { truncated = true; return; }
      const t = typeof v;
      if (v === null) { H.p(1); return; }
      if (t === 'undefined') { H.p(2); return; }
      if (t === 'number') { H.p(3); H.num(v); return; }
      if (t === 'boolean') { H.p(v ? 4 : 5); return; }
      if (t === 'string') { H.p(6); H.str(v); return; }
      if (t === 'bigint') { H.p(7); H.str(String(v)); return; }
      if (t === 'symbol') { H.p(8); return; }
      if (t === 'function') { H.p(9); H.str(v.name || ''); return; }
      const id = seen.get(v); if (id !== undefined) { H.p(10); H.p(id); return; }
      seen.set(v, seen.size); H.tick();
      const cn = v.constructor && v.constructor.name || '';
      if (SKIP.test(cn) || (typeof Node !== 'undefined' && v instanceof Node) || (typeof EventTarget !== 'undefined' && v instanceof EventTarget && !v.isObject3D)) { H.p(11); H.str(cn); return; }
      if (ArrayBuffer.isView(v)) { H.p(12); H.str(cn); H.bytes(v); return; }
      if (v instanceof ArrayBuffer) { H.p(13); H.bytes(new Uint8Array(v)); return; }
      if (Array.isArray(v)) { H.p(14); H.p(v.length); for (let i = 0; i < v.length; i++) w(v[i]); return; }
      if (v instanceof Map) { H.p(15); H.p(v.size); v.forEach((a, b) => { w(b); w(a); }); return; }
      if (v instanceof Set) { H.p(16); H.p(v.size); v.forEach(a => w(a)); return; }
      if (v.isObject3D) {
        H.p(17); H.str(v.type || ''); H.str(v.name || ''); H.p(v.visible ? 1 : 0); w(v.position); w(v.quaternion); w(v.scale);
        if (v.geometry) w(v.geometry); if (v.material) w(v.material); H.p(v.children.length); for (const c of v.children) w(c); w(v.userData); return;
      }
      if (v.isBufferGeometry) { H.p(18); H.p(v.index ? 1 : 0); if (v.index) w(v.index.array); const ks = Object.keys(v.attributes).sort(); for (const k of ks) { if (k === 'color' && !v.attributes.pav) continue; H.str(k); const a = v.attributes[k]; H.p(a.itemSize); w(a.array); } w(v.drawRange); w(v.groups); return; }
      if (v.isMaterial) { H.p(19); H.str(v.type); H.p(v.transparent ? 1 : 0); H.num(v.opacity); if (v.color) w([v.color.r, v.color.g, v.color.b]); H.p(v.vertexColors ? 1 : 0); return; }
      if (v.isTexture) { H.p(20); H.str(v.name || ''); return; }
      if (v.isWebGLRenderer || v.isScene && false) { H.p(21); return; }
      H.p(22); H.str(cn === 'Object' ? '' : cn);
      const ks = Object.keys(v); H.p(ks.length);
      for (const k of ks) { H.str(k); let x; try { x = v[k]; } catch (e) { x = '<err>'; } w(x); }
    })(root);
    return [H.done(), H.n(), truncated ? 1 : 0];
  }
  const ev = s => (0, eval)(s);
  window.BAKEDEEP = deep;
  window.BAKEHASH = {};
  /* noms a ignorer : donnees non deterministes (horloges), objets enormes sans interet */
  const IGN = new Set(['renderer', 'document', 'window', 'S', 'AUD', 'CLD', 'MP', 'ADP', 'GDB', 'GSTAT', 'GTEX', 'GWK']);
  window.BAKECP = function (label) {
    const names = window.__NAMES || [], out = {}, t0 = performance.now();
    for (const nm of names) {
      if (IGN.has(nm) || (window.__ONLY && !window.__ONLY.includes(nm))) continue;
      let v; try { v = ev(nm); } catch (e) { continue; }
      if (typeof v === 'function') continue;
      try { const t1 = performance.now(), r = deep(v); out[nm] = r; if (performance.now() - t1 > 800) r.push(Math.round(performance.now() - t1)); } catch (e) { out[nm] = ['ERR ' + e.message, 0, 0]; }
    }
    window.BAKEHASH[label] = out; window.BAKEHASH[label + '_ms'] = Math.round(performance.now() - t0);
  };
})();
