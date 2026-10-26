/* Cénacle : vérification automatique de la caméra (niveau par niveau).
   Usage : ouvrir le jeu (http://localhost:xxxx/index.html), puis dans la console du navigateur :
       await (await fetch('tools/verif-camera.js')).text().then(t => (0, eval)(t)); await verifCamera();
   Pour chaque niveau et une grille de positions praticables (pas de 3 m) + les lieux d'intérêt (autels, églises, coffres, boss, portes) :
     - calcule la caméra avec le VRAI code du jeu (camSolve : inclinaison minimale qui dégage le segment caméra -> héros) ;
     - vérifie, avec des rayons lancés contre la VRAIE géométrie (bâtiments, murs, rochers, églises) et le relief, que
       (a) la caméra n'est ni dans un solide ni sous un plafond, (b) le segment caméra -> héros (5 rayons autour de la tête) est libre ;
     - compare avec la caméra d'origine (inclinaison fixe) pour mesurer le problème corrigé.
   Résultat : tableau niveaux x points x échecs + liste des pires points. Zéro échec attendu (colonnes camDedans, rayBloques, coupe). */
async function verifCamera(opt) {
  opt = Object.assign({ pas: 3, rayEvery: 2, pires: 8, niveaux: null }, opt || {});
  const out = { niveaux: [], pires: [], total: { points: 0, rayons: 0, bloque0: 0, releves: 0, coupe: 0, surplombs: 0, camDedans: 0, rayBloques: 0, ray0Bloques: 0 } };
  while (!SOL.ok) await new Promise(r => setTimeout(r, 200));
  /* rayons : matériaux fusionnés en double face le temps du test */
  const mats = [XRM, ...Object.values(XRC)], sides = mats.map(m => m.side); mats.forEach(m => { m.side = THREE.DoubleSide; });
  const rc = new THREE.Raycaster(), cible = [];
  const solides = () => { const L = [...decor.children, ...BORD]; for (const o of Zs) if (o && o.plots) for (const p of o.plots) if (p.real) L.push(p.real); try { for (const o of Zs) if (o && o.gol && o.gol.g) L.push(o.gol.g); } catch (e) { } return L; };
  const L = solides(); L.forEach(o => o.updateMatrixWorld(true));
  const terrLibre = (ax, ay, az, bx, by, bz) => { const n = 80; for (let i = 1; i < n; i++) { const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t; if (terrY(x, z) + .3 > y) return false; } return true; };
  const bloque = (cx, cy, cz, hx, hy, hz) => {
    let res = null;
    const cibles = [[0, 1.2], [0, .6], [0, 1.7], [.25, 1.2], [-.25, 1.2]];
    for (const [dx, dy] of cibles) {
      const tx = hx + dx, ty = hy + dy, tz = hz, d = Math.hypot(tx - cx, ty - cy, tz - cz);
      if (!terrLibre(cx, cy, cz, tx, ty, tz)) return 'relief';
      rc.set(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(tx - cx, ty - cy, tz - cz).normalize()); rc.near = 0; rc.far = d - .35;
      const h = rc.intersectObjects(L, true).filter(q => d - q.distance > 1.0 && q.point.y > hy + .9);
      if (h.length) { const q = h[0], at = q.object.geometry && q.object.geometry.attributes.ovh, sur = !!(at && !q.object.geometry.index && at.array[q.faceIndex * 3] === 1); bloque.dernier = { x: +q.point.x.toFixed(1), y: +q.point.y.toFixed(1), z: +q.point.z.toFixed(1), aCible: +(d - q.distance).toFixed(1), surplomb: sur }; if (!sur) return 'solide'; res = 'surplomb'; }
    }
    return res;
  };
  const camDedans = (cx, cy, cz) => {
    if (terrY(cx, cz) + 1 > cy) return 'relief';
    rc.set(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(0, -1, 0)); rc.near = 0; rc.far = 1.0; if (rc.intersectObjects(L, true).length) return 'sous-camera';
    rc.set(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(0, 1, 0)); rc.far = 1.0; if (rc.intersectObjects(L, true).filter(q => { const at = q.object.geometry && q.object.geometry.attributes.ovh; return !(at && !q.object.geometry.index && at.array[q.faceIndex * 3] === 1); }).length) return 'plafond';
    return null;
  };
  const niveaux = opt.niveaux || [...Array(NZ).keys()];
  for (const zi of niveaux) {
    const X = PX[zi]; if (!X) continue;
    const pts = [], seen = new Set(), add = (x, z, tag) => { if (typeof x !== 'number' || typeof z !== 'number') return; const k = Math.round(x * 2) + ',' + Math.round(z * 2); if (seen.has(k)) return; seen.add(k); pts.push({ x, z, tag }); };
    for (let x = X.cx - 38; x <= X.cx + 38; x += opt.pas) for (let z = X.cz - 38; z <= X.cz + 38; z += opt.pas) {
      if (inWater(x, z)) continue; try { if (typeof wOwner === 'function' && wOwner(x, z) !== zi) continue; } catch (e) { } try { if (nvBlk(x, z, .45, false)) continue; } catch (e) { } add(x, z, 'grille');
    }
    const lieu = (x, z, t) => { try { if (nvBlk(x, z, .45, false)) { const f = nvFree(x, z, .6, false); x = f[0]; z = f[1]; } } catch (e) { } add(x, z, t); };
    if (X.obj) for (const k in X.obj) { const v = X.obj[k]; if (Array.isArray(v) && v.length >= 2 && typeof v[0] === 'number') lieu(v[0], v[1], k); }
    [X.start, X.entry, X.exit].forEach((v, i) => { if (v) lieu(v[0], v[1], ['depart', 'entree', 'sortie'][i]); });
    const Zo = Zs[zi]; if (Zo) { ['chests', 'sick', 'altars', 'plots', 'nodes'].forEach(k => (Zo[k] || []).forEach(e => { if (e && typeof e.x === 'number') lieu(e.x + 1.5, e.z + 1.5, k); })); }
    const R = { niveau: zi + 1, nom: (ZONES[zi] && ZONES[zi].n || '').slice(0, 26), points: 0, rayons: 0, bloque0: 0, releves: 0, coupe: 0, surplombs: 0, camDedans: 0, rayBloques: 0, ray0Bloques: 0, pitchMax: 0 };
    let idx = 0;
    for (const p of pts) {
      const hy = gy(p.x, p.z), r = camSolve(p.x, p.z, hy); R.points++; idx++;
      if (r.blocked0) R.bloque0++; if (r.th > CAMT0 + 1e-4) R.releves++; if (r.forced) R.coupe++; R.pitchMax = Math.max(R.pitchMax, r.th * 180 / Math.PI);
      const test = r.blocked0 || r.th > CAMT0 + 1e-4 || r.forced || p.tag !== 'grille' || idx % opt.rayEvery === 0;
      if (!test) continue; R.rayons++;
      const cx = p.x, cy = hy + CAMD * Math.sin(r.th), cz = p.z + CAMD * Math.cos(r.th);
      const dedans = camDedans(cx, cy, cz), bl = bloque(cx, cy, cz, p.x, hy, p.z), touche = bl && bl !== 'relief' ? bloque.dernier : null;
      const cx0 = p.x, cy0 = hy + CAMH, cz0 = p.z + CAMZ, bl0 = bloque(cx0, cy0, cz0, p.x, hy, p.z);
      if (bl0) R.ray0Bloques++;
      if (dedans) R.camDedans++;
      if (bl === 'surplomb') { R.surplombs++; if (!(r.ovh || r.forced)) R.rayBloques++; } else if (bl && !r.forced) R.rayBloques++;
      const sev = (bl === 'surplomb' ? (r.ovh || r.forced ? 0 : 3) : (bl && !r.forced ? 3 : 0)) + (dedans ? 3 : 0) + (r.forced ? 1 : 0) + (r.th * 180 / Math.PI > 80 ? 1 : 0);
      if (sev) out.pires.push({ niveau: zi + 1, x: +p.x.toFixed(1), z: +p.z.toFixed(1), hy: +hy.toFixed(1), lieu: p.tag, pitch: +(r.th * 180 / Math.PI).toFixed(1), coupe: r.forced, camDedans: dedans, rayon: bl, touche: touche, sol: +(solTop(p.x, p.z) - hy).toFixed(1), sev });
      if (opt.tous && bl && !r.forced) (out.echecs = out.echecs || []).push({ niveau: zi + 1, x: +p.x.toFixed(1), z: +p.z.toFixed(1), hy: +hy.toFixed(1), pitch: +(r.th * 180 / Math.PI).toFixed(1), rayon: bl, touche: touche });
      if (opt.tous && r.forced) (out.forces = out.forces || []).push({ niveau: zi + 1, x: +p.x.toFixed(1), z: +p.z.toFixed(1), hy: +hy.toFixed(1), surLeHeros: +(solTop(p.x, p.z) - hy).toFixed(1), tag: p.tag });
    }
    out.niveaux.push(R); for (const k in out.total) out.total[k] += R[k] || 0;
    await new Promise(r => setTimeout(r, 0));
  }
  mats.forEach((m, i) => { m.side = sides[i]; });
  out.pires.sort((a, b) => b.sev - a.sev); out.pires = out.pires.slice(0, opt.pires);
  try { console.table(out.niveaux); console.log('TOTAL', out.total); console.log('PIRES', out.pires); } catch (e) { }
  return out;
}
if (typeof window !== 'undefined') window.verifCamera = verifCamera;
