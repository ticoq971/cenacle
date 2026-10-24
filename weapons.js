/* Cénacle · Armes de foi : modèles 3D procéduraux (Three.js r128, aucun fichier externe).
   Repère : la main tient l'arme à l'origine, l'arme s'étend vers +Y. Unité : mètre, pour un héros de 1,80 m.
   Chaque fabrique renvoie un THREE.Group ; userData.tip = point d'émission (bout de l'arme). */
(function (root) {
  const T = THREE, V3 = (x, y, z) => new T.Vector3(x, y, z), V2 = (x, y) => new T.Vector2(x, y);
  const MAT = {};
  function mat(k) {
    if (MAT[k]) return MAT[k];
    const S = (o) => new T.MeshStandardMaterial(o);
    const D = {
      gold: S({ color: 0xe8b84a, metalness: .85, roughness: .32, emissive: 0x3a2400, emissiveIntensity: .35 }),
      goldD: S({ color: 0xb8862a, metalness: .8, roughness: .45 }),
      wood: S({ color: 0x5a3418, metalness: 0, roughness: .78 }),
      woodL: S({ color: 0x8a5a2e, metalness: 0, roughness: .72 }),
      leather: S({ color: 0x5a3418, metalness: 0, roughness: .85 }),
      cord: S({ color: 0xb8945a, metalness: 0, roughness: .95 }),
      cordD: S({ color: 0x8a6a3a, metalness: 0, roughness: .95 }),
      stone: S({ color: 0x9a948a, metalness: 0, roughness: .9 }),
      stoneL: S({ color: 0xd8d0c0, metalness: 0, roughness: .85 }),
      bronze: S({ color: 0x9a6a3a, metalness: .7, roughness: .4 }),
      horn: S({ color: 0xe0cfa6, metalness: .05, roughness: .55 }),
      hornD: S({ color: 0x8a6a42, metalness: .05, roughness: .6 }),
      parch: S({ color: 0xf0e2bc, metalness: 0, roughness: .9, side: T.DoubleSide }),
      ink: S({ color: 0xb8862a, metalness: .6, roughness: .4, side: T.DoubleSide }),
      green: S({ color: 0x5a8a3a, metalness: .1, roughness: .6 }),
      greenD: S({ color: 0x2f5a24, metalness: .1, roughness: .6 }),
      blossom: S({ color: 0xfff0f4, metalness: 0, roughness: .6, emissive: 0x3a2a2a, emissiveIntensity: .2 }),
      gem: S({ color: 0xfff1b0, metalness: .2, roughness: .1, emissive: 0xffc840, emissiveIntensity: .8 }),
      ruby: S({ color: 0xc0302a, metalness: .3, roughness: .2, emissive: 0x401010, emissiveIntensity: .4 }),
      glow: new T.MeshBasicMaterial({ color: 0xffc840, transparent: true, opacity: .55, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }),
      smoke: new T.MeshStandardMaterial({ color: 0xeeeeee, transparent: true, opacity: .45, roughness: 1, depthWrite: false }),
      clay: S({ color: 0xb8673a, metalness: 0, roughness: .8 }),
      eye: S({ color: 0x111111, roughness: .2 }),
    };
    Object.assign(MAT, D); return MAT[k];
  }
  const M = (g, m) => new T.Mesh(g, mat(m));
  /* tube à rayon variable le long d'une spline (Catmull-Rom) : r(t) */
  function vtube(pts, segs, rad, rfun, closed) {
    const c = new T.CatmullRomCurve3(pts, !!closed, 'catmullrom', .5), g = new T.TubeGeometry(c, segs, 1, rad, !!closed), p = g.attributes.position;
    for (let i = 0; i <= segs; i++) { const t = i / segs, P = c.getPointAt(t), r = rfun(t); for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; p.setXYZ(k, P.x + (p.getX(k) - P.x) * r, P.y + (p.getY(k) - P.y) * r, P.z + (p.getZ(k) - P.z) * r); } }
    g.computeVertexNormals(); return g;
  }
  const tube = (pts, segs, r, rad, closed) => new T.TubeGeometry(new T.CatmullRomCurve3(pts, !!closed, 'catmullrom', .5), segs, r, rad || 6, !!closed);
  const lathe = (prof, seg) => new T.LatheGeometry(prof.map(a => V2(a[0], a[1])), seg || 16);
  const ring = (r, t, y, m, seg) => { const o = M(new T.TorusGeometry(r, t, 6, seg || 18), m); o.rotation.x = Math.PI / 2; o.position.y = y; return o; };

  /* 1. La Parole : rouleau déroulé, lettres d'or, aura */
  function makeWeapon_parole() {
    const g = new T.Group(), H = .34, W = .30;
    const rod = () => { const r = new T.Group(); r.add(M(lathe([[0, -.03], [.022, -.03], [.026, -.015], [.016, 0], [.016, H], [.026, H + .015], [.022, H + .03], [0, H + .03]], 14), 'wood'));
      [[-.045, -.03], [H + .045, H + .03]].forEach(([y, y0]) => { const k = M(new T.SphereGeometry(.022, 12, 8), 'gold'); k.position.y = y; r.add(k); }); return r; };
    const a = rod(), b = rod(); a.position.set(-W / 2, 0, 0); b.position.set(W / 2, 0, 0);
    const sheet = new T.PlaneGeometry(W, H * .92, 24, 4), p = sheet.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, -.035 * Math.cos(x / W * Math.PI) + .01); p.setY(i, p.getY(i) + H / 2); } sheet.computeVertexNormals();
    g.add(a, b, M(sheet, 'parch'));
    for (let l = 0; l < 6; l++) { const w = W * (.62 + .18 * Math.sin(l * 2.3)), ln = new T.PlaneGeometry(w, .012, 12, 1), q = ln.attributes.position; for (let i = 0; i < q.count; i++) { const x = q.getX(i); q.setZ(i, -.035 * Math.cos(x / W * Math.PI) + .013); q.setY(i, q.getY(i) + .06 + l * .042); } g.add(M(ln, 'ink')); }
    const halo = M(new T.RingGeometry(.2, .24, 40), 'glow'); halo.position.set(0, H / 2, -.05); g.add(halo);
    g.rotation.z = .12; g.userData.tip = V3(0, H, 0); return g;
  }
  /* 2. Bâton d'Aaron : bois effilé, serpent enroulé (tube spline à rayon variable), amandier en fleur (Nb 17,23) */
  function makeWeapon_aaron() {
    const g = new T.Group(), L = 1.5;
    const sh = []; for (let i = 0; i <= 10; i++) { const t = i / 10; sh.push(V3(.012 * Math.sin(t * 7), -.25 + t * L, .01 * Math.cos(t * 5))); }
    g.add(M(vtube(sh, 48, 7, t => .028 - .01 * t, false), 'wood'));
    const knob = M(new T.SphereGeometry(.034, 12, 10), 'woodL'); knob.position.copy(sh[10]); knob.scale.set(1, 1.3, 1); g.add(knob);
    const sp = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * Math.PI * 2 * 3.2, y = .05 + t * 1.05; sp.push(V3(Math.cos(a) * .05, y, Math.sin(a) * .05)); }
    sp.push(V3(.10, 1.17, .04), V3(.16, 1.2, .06));
    const snake = M(vtube(sp, 160, 8, t => t < .04 ? .006 + t * .3 : t > .93 ? .018 + (t - .93) * .25 : .018 + .006 * Math.sin(t * 3), false), 'green'); g.add(snake);
    const head = M(new T.SphereGeometry(.03, 14, 10), 'greenD'); head.scale.set(1.5, .8, 1); head.position.set(.17, 1.2, .065); head.rotation.y = -.4; g.add(head);
    [[.03], [-.03]].forEach(([z]) => { const e = M(new T.SphereGeometry(.007, 8, 6), 'eye'); e.position.set(.19, 1.212, .065 + z * .6); g.add(e); });
    for (let i = 0; i < 7; i++) { const f = new T.Group(), a = i * 2.1, y = 1.1 + i * .022; for (let k = 0; k < 5; k++) { const pe = M(new T.SphereGeometry(.012, 8, 6), 'blossom'); pe.scale.set(1, .45, 1.6); pe.position.set(Math.cos(k * 1.256) * .013, 0, Math.sin(k * 1.256) * .013); pe.rotation.y = -k * 1.256; f.add(pe); } const c = M(new T.SphereGeometry(.006, 6, 4), 'gold'); f.add(c); f.position.set(Math.cos(a) * .035, y, Math.sin(a) * .035); f.rotation.set(Math.cos(a) * .9, 0, -Math.sin(a) * .9); g.add(f);
      const lf = M(new T.SphereGeometry(.016, 8, 4), 'greenD'); lf.scale.set(.35, .12, 1); lf.position.set(Math.cos(a + 1) * .03, y - .03, Math.sin(a + 1) * .03); lf.rotation.y = -a; g.add(lf); }
    g.add(ring(.03, .006, .0, 'gold'), ring(.03, .006, .12, 'gold'));
    g.userData.tip = V3(0, 1.25, 0); return g;
  }
  /* 3. Fouet de cordes (Jn 2,15) : manche tourné, 5 cordes nouées (splines) */
  function makeWeapon_fouet() {
    const g = new T.Group();
    g.add(M(lathe([[0, -.06], [.026, -.06], [.03, -.045], [.02, -.03], [.019, .2], [.024, .22], [.022, .25], [0, .26]], 16), 'wood'));
    for (let i = 0; i < 6; i++) g.add(ring(.021, .005, .0 + i * .035, 'leather', 14));
    const pm = M(new T.SphereGeometry(.03, 14, 10), 'gold'); pm.position.y = -.07; g.add(pm); g.add(ring(.025, .006, .245, 'gold'));
    for (let c = 0; c < 5; c++) { const a = (c - 2) * .22, pts = []; for (let i = 0; i <= 9; i++) { const t = i / 9; pts.push(V3(.42 * Math.sin(t * 1.9) + a * .25 * t + .025 * Math.sin(t * 6 + c), .25 + .5 * Math.sin(t * 2.2) - .32 * t * t + a * .1 * t, a * .35 * t + .04 * Math.sin(t * 4 + c * 1.7))); }
      const cu = new T.CatmullRomCurve3(pts); g.add(M(new T.TubeGeometry(cu, 60, .0065, 6, false), c % 2 ? 'cord' : 'cordD'));
      [.35, .65, .97].forEach(t => { const k = M(new T.SphereGeometry(.012, 8, 6), 'cordD'); k.position.copy(cu.getPointAt(t)); k.scale.set(1, 1.3, 1); g.add(k); }); }
    g.userData.tip = V3(.4, .4, 0); return g;
  }
  /* 4. Fronde de David : poche de cuir, deux lanières (splines), caillou */
  function makeWeapon_fronde() {
    const g = new T.Group(), bot = V3(0, -.55, .03);
    const cup = new T.SphereGeometry(.06, 18, 10, 0, Math.PI * 2, Math.PI * .45, Math.PI * .55), p = cup.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * 1.35); cup.computeVertexNormals();
    const pouch = M(cup, 'leather'); pouch.material = mat('leather'); pouch.position.copy(bot); pouch.rotation.x = Math.PI; g.add(pouch);
    const st = M(new T.IcosahedronGeometry(.042, 1), 'stone'); st.position.set(0, -.535, .03); st.scale.set(1.1, .9, 1); g.add(st);
    [-1, 1].forEach(s => { const pts = [V3(.08 * s, -.53, .03), V3(.07 * s, -.36, .05), V3(.03 * s, -.15, .02), V3(.008 * s, 0, 0)]; g.add(M(tube(pts, 40, .006, 6), 'leather')); });
    const loop = M(new T.TorusGeometry(.03, .006, 6, 18), 'leather'); loop.position.y = .03; g.add(loop);
    g.add(ring(.012, .007, .0, 'gold', 12));
    g.userData.tip = V3(0, -.55, 0); return g;
  }
  /* 5. Bâton du berger : houlette (tube spline effilé), viroles d'or */
  function makeWeapon_berger() {
    const g = new T.Group(), pts = [V3(0, -.3, 0), V3(.005, .4, 0), V3(0, 1.1, 0), V3(0, 1.3, 0), V3(.04, 1.4, 0), V3(.13, 1.44, 0), V3(.21, 1.4, 0), V3(.24, 1.31, 0), V3(.22, 1.24, 0)];
    g.add(M(vtube(pts, 120, 8, t => .026 - .006 * t, false), 'woodL'));
    g.add(ring(.029, .006, -.28, 'gold'), ring(.028, .007, 1.12, 'gold'), ring(.028, .005, 1.16, 'gold'));
    const tip = M(new T.SphereGeometry(.022, 10, 8), 'gold'); tip.position.copy(pts[8]); g.add(tip);
    g.userData.tip = V3(.12, 1.42, 0); return g;
  }
  /* 6. Filet de Pierre : maille drapée (cordes en splines), flotteurs de liège, plombs */
  function makeWeapon_filet() {
    const g = new T.Group(), N = 8, w = .7, h = .6, P = (u, v) => V3((u - .5) * w * (1 - .25 * v), -v * h, -.18 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v * .9) - .05 * v);
    for (let i = 0; i <= N; i++) { const a = [], b = []; for (let k = 0; k <= 12; k++) { a.push(P(i / N, k / 12)); b.push(P(k / 12, i / N)); } g.add(M(tube(a, 24, .0045, 4), 'cord')); g.add(M(tube(b, 24, .0045, 4), 'cord')); }
    for (let i = 0; i <= N; i++) for (let k = 0; k <= N; k++) { const kn = M(new T.SphereGeometry(.007, 6, 4), 'cordD'); kn.position.copy(P(i / N, k / N)); g.add(kn); }
    for (let i = 0; i <= 4; i++) { const f = M(new T.CylinderGeometry(.022, .022, .05, 12), 'woodL'); f.rotation.z = Math.PI / 2; f.position.copy(P(i / 4, 0)); g.add(f); const s = M(new T.SphereGeometry(.014, 8, 6), 'stone'); s.position.copy(P(i / 4, 1)); g.add(s); }
    const top = []; for (let k = 0; k <= 8; k++) top.push(P(k / 8, 0)); g.add(M(tube(top, 30, .008, 6), 'cordD'));
    g.position.y = .1; const o = new T.Group(); o.add(g); g.position.set(0, .62, 0); o.userData.tip = V3(0, .3, -.1); return o;
  }
  /* 7. Marteau de la Parole (Jr 23,29) : tête de pierre biseautée (extrusion), bandeau et croix d'or, manche tourné */
  function makeWeapon_marteau() {
    const g = new T.Group();
    g.add(M(lathe([[0, -.05], [.03, -.05], [.034, -.03], [.024, 0], [.022, .5], [.028, .52], [.03, .56], [0, .56]], 16), 'wood'));
    for (let i = 0; i < 5; i++) g.add(ring(.025, .005, .02 + i * .03, 'leather', 14));
    const s = new T.Shape(), a = .07, r = .02; s.moveTo(-a + r, -a); s.lineTo(a - r, -a); s.quadraticCurveTo(a, -a, a, -a + r); s.lineTo(a, a - r); s.quadraticCurveTo(a, a, a - r, a); s.lineTo(-a + r, a); s.quadraticCurveTo(-a, a, -a, a - r); s.lineTo(-a, -a + r); s.quadraticCurveTo(-a, -a, -a + r, -a);
    const hg = new T.ExtrudeGeometry(s, { depth: .3, bevelEnabled: true, bevelThickness: .018, bevelSize: .014, bevelSegments: 3, curveSegments: 6 }); hg.translate(0, 0, -.15);
    const head = M(hg, 'stoneL'); head.rotation.y = Math.PI / 2; head.position.y = .62; g.add(head);
    [-.09, .09].forEach(x => { const b = M(new T.BoxGeometry(.018, .17, .17), 'gold'); b.position.set(x, .62, 0); g.add(b); });
    const cs = new T.Shape(); [[-.012, -.05], [.012, -.05], [.012, .012], [.035, .012], [.035, .034], [.012, .034], [.012, .055], [-.012, .055], [-.012, .034], [-.035, .034], [-.035, .012], [-.012, .012]].forEach((q, i) => i ? cs.lineTo(q[0], q[1]) : cs.moveTo(q[0], q[1]));
    [-1, 1].forEach(sd => { const c = M(new T.ExtrudeGeometry(cs, { depth: .008, bevelEnabled: true, bevelThickness: .003, bevelSize: .003, bevelSegments: 1 }), 'gold'); c.position.set(0, .615, .088 * sd); if (sd < 0) c.rotation.y = Math.PI; g.add(c); });
    g.userData.tip = V3(0, .62, 0); return g;
  }
  /* 8. Trompettes de Jéricho : cor en corne de bélier (tube spline évasé, torsadé), embouchure d'or */
  function makeWeapon_jericho() {
    const g = new T.Group(), pts = [V3(0, 0, 0), V3(.03, .14, .01), V3(.075, .3, .03), V3(.07, .45, .05), V3(.01, .56, .06), V3(-.08, .62, .05), V3(-.17, .64, .03)];
    const geo = vtube(pts, 120, 18, t => .011 + .042 * Math.pow(t, 2.2) + (t > .88 ? Math.pow((t - .88) / .12, 2) * .03 : 0), false);
    const p = geo.attributes.position, c = new T.CatmullRomCurve3(pts); for (let i = 0; i <= 120; i++) { const P0 = c.getPointAt(i / 120); for (let j = 0; j <= 18; j++) { const k = i * 19 + j, d = V3(p.getX(k) - P0.x, p.getY(k) - P0.y, p.getZ(k) - P0.z), f = 1 + .07 * Math.sin(j / 18 * Math.PI * 2 * 3 + i * .25); p.setXYZ(k, P0.x + d.x * f, P0.y + d.y * f, P0.z + d.z * f); } }
    geo.computeVertexNormals();
    const cols = new Float32Array(p.count * 3), A = new T.Color(0xe8d8b0), B = new T.Color(0x7a5a38); for (let i = 0; i <= 120; i++) for (let j = 0; j <= 18; j++) { const k = i * 19 + j, t = i / 120, cc = A.clone().lerp(B, Math.max(0, (t - .55) / .45) * .8 + .12 * (Math.sin(i * .9) * .5 + .5)); cols.set([cc.r, cc.g, cc.b], k * 3); }
    geo.setAttribute('color', new T.BufferAttribute(cols, 3)); g.add(new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, metalness: .05, side: T.DoubleSide })));
    g.add(M(lathe([[0, -.035], [.02, -.035], [.016, -.01], [.014, .02], [0, .02]], 14), 'gold'));
    [.2, .45, .78].forEach(t => { const P0 = c.getPointAt(t), tg = c.getTangentAt(t), rr = .011 + .042 * Math.pow(t, 2.2), o = M(new T.TorusGeometry(rr * 1.12, .006, 6, 24), 'gold'); o.position.copy(P0); o.lookAt(P0.clone().add(tg)); g.add(o); });
    g.userData.tip = pts[6].clone(); return g;
  }
  /* 9. Encensoir : coupe et couvercle tournés (lathe), ajours, 3 chaînes, croix, fumée */
  function makeWeapon_encensoir() {
    const g = new T.Group(), y0 = -.42;
    const bowl = M(lathe([[0, -.07], [.03, -.07], [.035, -.055], [.02, -.045], [.05, -.03], [.075, 0], [.08, .02], [.082, .03], [0, .03]], 24), 'gold'); bowl.position.y = y0; g.add(bowl);
    const lid = M(lathe([[.083, .03], [.08, .05], [.065, .09], [.04, .13], [.028, .16], [.02, .19], [.012, .21], [0, .215]], 24), 'goldD'); lid.position.y = y0; g.add(lid);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, h = M(new T.CylinderGeometry(.009, .009, .02, 8), 'eye'); h.position.set(Math.cos(a) * .072, y0 + .068, Math.sin(a) * .072); h.lookAt(0, y0 + .068, 0); h.rotateX(Math.PI / 2); g.add(h); }
    g.add(ring(.082, .006, y0 + .03, 'gold', 28));
    const cr = new T.Group(), v = M(new T.BoxGeometry(.01, .05, .01), 'gold'), hz = M(new T.BoxGeometry(.03, .01, .01), 'gold'); hz.position.y = .008; cr.add(v, hz); cr.position.y = y0 + .24; g.add(cr);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, pts = [V3(Math.cos(a) * .078, y0 + .03, Math.sin(a) * .078), V3(Math.cos(a) * .04, y0 + .3, Math.sin(a) * .04), V3(0, 0, 0)]; const cu = new T.CatmullRomCurve3(pts); for (let k = 0; k < 22; k++) { const l = M(new T.TorusGeometry(.007, .0022, 4, 8), 'goldD'); l.position.copy(cu.getPointAt(k / 22)); l.lookAt(cu.getPointAt(Math.min(1, k / 22 + .02))); if (k % 2) l.rotateZ(Math.PI / 2); g.add(l); } }
    const disk = M(new T.CylinderGeometry(.03, .03, .01, 18), 'gold'); disk.position.y = .005; g.add(disk); g.add(ring(.018, .005, .03, 'gold', 14));
    for (let i = 0; i < 6; i++) { const s = M(new T.SphereGeometry(.018 + i * .006, 12, 8), 'smoke'); s.position.set(.015 * Math.sin(i * 1.7) + i * .012, y0 + .25 + i * .04, .01 * i); g.add(s); }
    g.userData.tip = V3(0, y0, 0); return g;
  }
  /* 10. Croix glorieuse : croix latine extrudée et biseautée, gemme, rayons */
  function makeWeapon_croix() {
    const g = new T.Group(), s = new T.Shape(), a = .022, top = .62, arm = .16, ay = .44;
    [[-a, 0], [a, 0], [a, ay - a], [arm, ay - a], [arm, ay + a], [a, ay + a], [a, top], [-a, top], [-a, ay + a], [-arm, ay + a], [-arm, ay - a], [-a, ay - a]].forEach((q, i) => i ? s.lineTo(q[0], q[1]) : s.moveTo(q[0], q[1]));
    const geo = new T.ExtrudeGeometry(s, { depth: .022, bevelEnabled: true, bevelThickness: .008, bevelSize: .007, bevelSegments: 3, curveSegments: 4 }); geo.translate(0, 0, -.011); g.add(M(geo, 'gold'));
    [[0, top], [arm, ay], [-arm, ay]].forEach(([x, y]) => { const b = M(new T.SphereGeometry(.022, 12, 8), 'gold'); b.position.set(x + (x ? Math.sign(x) * .012 : 0), y + (x ? 0 : .012), 0); g.add(b); });
    const gm = M(new T.OctahedronGeometry(.03, 0), 'ruby'); gm.position.set(0, ay, .028); gm.scale.set(1, 1.2, .5); g.add(gm);
    g.add(M(lathe([[0, -.18], [.02, -.18], [.024, -.16], [.017, -.14], [.017, 0], [0, 0]], 14), 'goldD'));
    const rays = new T.Group(); for (let i = 0; i < 16; i++) { const r = M(new T.PlaneGeometry(.014, i % 2 ? .12 : .2), 'glow'); r.position.set(0, (i % 2 ? .06 : .1), 0); const p = new T.Group(); p.add(r); p.rotation.z = i / 16 * Math.PI * 2; rays.add(p); } rays.position.set(0, ay, -.03); g.add(rays);
    const halo = M(new T.TorusGeometry(.1, .006, 6, 40), 'gold'); halo.position.set(0, ay, -.02); g.add(halo);
    g.userData.tip = V3(0, top, 0); return g;
  }

  /* 11. Glaive de l'Esprit (Ep 6,17) : lame extrudée biseautée, garde d'or, poignée tournée, halo de feu animé (particules + langues émissives) */
  let FIRET = null;
  function fireTex() { if (FIRET) return FIRET; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,220,1)'); g.addColorStop(.25, 'rgba(255,210,90,.95)'); g.addColorStop(.6, 'rgba(255,110,20,.45)'); g.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); FIRET = new T.CanvasTexture(c); return FIRET; }
  function makeWeapon_glaive() {
    const g = new T.Group(), L = 1.0, w = .055;
    const s = new T.Shape(); s.moveTo(-w, 0); s.lineTo(-w * .92, L * .8); s.quadraticCurveTo(-w * .7, L * .95, 0, L); s.quadraticCurveTo(w * .7, L * .95, w * .92, L * .8); s.lineTo(w, 0); s.lineTo(-w, 0);
    const bg = new T.ExtrudeGeometry(s, { depth: .008, bevelEnabled: true, bevelThickness: .012, bevelSize: .016, bevelSegments: 2, curveSegments: 10 }); bg.translate(0, .1, -.004);
    const blade = new T.Mesh(bg, new T.MeshStandardMaterial({ color: 0xf4f0ff, metalness: .95, roughness: .12, emissive: 0xff9a30, emissiveIntensity: .35 })); g.add(blade);
    const fu = M(new T.BoxGeometry(.012, L * .72, .022), 'gold'); fu.position.y = .1 + L * .38; g.add(fu);
    const gs = new T.Shape(); gs.moveTo(-.2, -.015); gs.quadraticCurveTo(-.24, .02, -.21, .05); gs.quadraticCurveTo(-.15, .02, 0, .03); gs.quadraticCurveTo(.15, .02, .21, .05); gs.quadraticCurveTo(.24, .02, .2, -.015); gs.quadraticCurveTo(0, -.03, -.2, -.015);
    const guard = M(new T.ExtrudeGeometry(gs, { depth: .03, bevelEnabled: true, bevelThickness: .008, bevelSize: .006, bevelSegments: 2, curveSegments: 8 }), 'gold'); guard.position.set(0, .07, -.015); g.add(guard);
    const gem = M(new T.OctahedronGeometry(.03, 0), 'ruby'); gem.position.set(0, .085, .03); gem.scale.set(1, 1.3, .5); g.add(gem);
    g.add(M(lathe([[0, -.2], [.02, -.2], [.024, -.17], [.02, -.14], [.022, .0], [.03, .04], [0, .06]], 14), 'leather'));
    for (let i = 0; i < 6; i++) g.add(ring(.023, .004, -.15 + i * .028, 'gold', 12));
    const pm = M(new T.SphereGeometry(.036, 16, 12), 'gold'); pm.position.y = -.23; g.add(pm);
    /* langues de feu le long de la lame */
    const flames = new T.Group(), fm = new T.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: .32, blending: T.AdditiveBlending, depthWrite: false }), fm2 = new T.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 14; i++) { const t = i / 13, side = i % 2 ? 1 : -1, c = new T.Mesh(new T.ConeGeometry(.03 + .02 * Math.sin(t * 3), .16, 8, 1, true), i % 3 ? fm : fm2); c.position.set(side * (w + .02) * (1 - t * .8), .14 + t * (L - .06), 0); c.rotation.z = -side * .35; c.userData.ph = i * 1.7; flames.add(c); }
    g.add(flames);
    /* halo : anneau de particules de feu autour de la lame */
    const N = 110, P = new Float32Array(N * 3), A = new Float32Array(N); for (let i = 0; i < N; i++) { A[i] = Math.random(); const a = Math.random() * Math.PI * 2, r = .2 + Math.random() * .06, y = .1 + Math.random() * L; P.set([Math.cos(a) * r * (1 - (y - .1) / L * .6), y, Math.sin(a) * r * .5], i * 3); }
    const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(P, 3)); const pts = new T.Points(pg, new T.PointsMaterial({ size: .03, map: fireTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: 0xffb040 })); g.add(pts);
    const halo = new T.Mesh(new T.TorusGeometry(.2, .012, 6, 48), new T.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false })); halo.position.y = .1 + L * .55; halo.scale.set(1, 3.2, 1); g.add(halo);
    const light = new T.PointLight(0xff8a30, .8, 3); light.position.y = .6; g.add(light);
    const P0 = P.slice();
    g.userData.update = t => { flames.children.forEach(c => { const k = .8 + .35 * Math.sin(t * 9 + c.userData.ph); c.scale.set(k, .7 + .5 * Math.abs(Math.sin(t * 7 + c.userData.ph)), k); });
      for (let i = 0; i < N; i++) { const u = (A[i] + t * .35) % 1; P[i * 3 + 1] = .1 + u * L; P[i * 3] = P0[i * 3] * (1 - u * .5) * (1 + .1 * Math.sin(t * 6 + i)); } pg.attributes.position.needsUpdate = true; halo.rotation.y = t * 1.5; light.intensity = .7 + .3 * Math.sin(t * 11); };
    g.userData.update(.7); g.userData.tip = V3(0, 1.1, 0); return g;
  }

  /* 12. Lampe de la Parole (Ps 118,105) : lampe à huile hérodienne tournée, bec, anse, flamme émissive animée, sur une hampe courte */
  function makeWeapon_lampe() {
    const g = new T.Group();
    g.add(M(lathe([[0, -.2], [.018, -.2], [.022, -.17], [.016, -.14], [.016, .22], [.024, .24], [0, .26]], 12), 'woodL'));
    for (let i = 0; i < 3; i++) g.add(ring(.019, .004, -.12 + i * .03, 'gold', 12));
    const cup = new T.Group(); cup.position.y = .3; g.add(cup);
    const body = M(lathe([[0, -.03], [.05, -.028], [.075, -.01], [.078, .005], [.06, .02], [.03, .026], [.02, .034], [0, .034]], 20), 'clay'); cup.add(body);
    const sp = M(new T.CylinderGeometry(.018, .024, .09, 10), 'clay'); sp.rotation.z = Math.PI / 2; sp.position.set(.09, .003, 0); cup.add(sp);
    const hd = M(new T.TorusGeometry(.03, .008, 6, 14, Math.PI * 1.2), 'clay'); hd.position.set(-.08, .01, 0); hd.rotation.z = Math.PI * .4; cup.add(hd);
    cup.add(ring(.078, .005, .004, 'gold', 24));
    const fl = new T.Group(); fl.position.set(.135, .02, 0); cup.add(fl);
    const f1 = new T.Mesh(new T.SphereGeometry(.03, 12, 10), new T.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false })); f1.scale.set(.8, 2.2, .8); f1.position.y = .05; fl.add(f1);
    const f2 = new T.Mesh(new T.SphereGeometry(.016, 10, 8), new T.MeshBasicMaterial({ color: 0xfffbe0 })); f2.scale.set(.8, 1.9, .8); f2.position.y = .04; fl.add(f2);
    const gl = new T.Mesh(new T.SphereGeometry(.11, 16, 12), new T.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: .18, blending: T.AdditiveBlending, depthWrite: false })); gl.position.y = .05; fl.add(gl);
    const li = new T.PointLight(0xffc060, .7, 2.5); li.position.y = .06; fl.add(li);
    g.userData.update = t => { const k = 1 + .12 * Math.sin(t * 13) + .06 * Math.sin(t * 29); f1.scale.set(.8 * k, 2.2 / k + .2 * Math.sin(t * 9), .8 * k); gl.material.opacity = .14 + .06 * Math.sin(t * 7); li.intensity = .6 + .2 * Math.sin(t * 11); };
    g.userData.update(.3); g.userData.tip = V3(.135, .4, 0); return g;
  }
  /* 13. Rameau de palmier (Jn 12,13) : nervure courbe (tube), folioles effilées des deux côtés, ruban d'or au manche */
  function makeWeapon_rameaux() {
    const g = new T.Group(), pts = [V3(0, -.2, 0), V3(0, .1, 0), V3(.02, .4, .01), V3(.08, .7, .02), V3(.18, .92, .03)];
    const c = new T.CatmullRomCurve3(pts); g.add(M(vtube(pts, 40, 6, t => .016 * (1 - t * .8)), 'greenD'));
    const lf = new T.MeshStandardMaterial({ color: 0x6aa040, roughness: .6, side: T.DoubleSide }), lf2 = new T.MeshStandardMaterial({ color: 0x4a8a30, roughness: .6, side: T.DoubleSide });
    const leaf = (len) => { const s = new T.Shape(); s.moveTo(0, -.006); s.quadraticCurveTo(len * .5, -.016, len, 0); s.quadraticCurveTo(len * .5, .016, 0, .006); return new T.ShapeGeometry(s, 4); };
    for (let i = 0; i < 26; i++) { const t = .22 + i / 26 * .76, P = c.getPointAt(t), tg = c.getTangentAt(t); for (const sd of [-1, 1]) { const len = .2 * Math.sin(Math.PI * (t - .15) / .9) + .05, m = new T.Mesh(leaf(len), i % 2 ? lf : lf2); m.position.copy(P); const base = Math.atan2(tg.y, tg.x); m.rotation.z = base + sd * (.85 - t * .35) * 1.3 + (sd < 0 ? Math.PI : 0) * 0; if (sd < 0) { m.rotation.z = base + Math.PI - (.85 - t * .35) * 1.3; } m.rotation.x = sd * .35; g.add(m); } }
    for (let i = 0; i < 4; i++) g.add(ring(.019, .005, -.16 + i * .035, 'gold', 12));
    g.userData.tip = V3(.18, .92, .03); return g;
  }
  /* VFX · Anneaux de foi (pouvoir actif de la Croix glorieuse) : tores d'or lumineux qui s'élargissent depuis le héros */
  function makeFaithRing() {
    const g = new T.Group();
    const core = new T.Mesh(new T.TorusGeometry(1, .045, 8, 72), new T.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: .95, blending: T.AdditiveBlending, depthWrite: false }));
    const glow = new T.Mesh(new T.TorusGeometry(1, .16, 8, 72), new T.MeshBasicMaterial({ color: 0xffb830, transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false }));
    [core, glow].forEach(m => { m.rotation.x = Math.PI / 2; g.add(m); });
    const N = 24, sp = new T.Group(); for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, s = new T.Mesh(new T.OctahedronGeometry(.06, 0), new T.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false })); s.position.set(Math.cos(a), 0, Math.sin(a)); sp.add(s); } g.add(sp);
    /* r : rayon courant (m), a : opacité 0..1 */
    g.userData.set = (r, a, t) => { core.scale.set(r, r, 1); glow.scale.set(r, r, 1.6); sp.scale.setScalar(r); sp.children.forEach((s, i) => { s.scale.setScalar(1 / Math.max(.5, r) * (1 + .4 * Math.sin(t * 9 + i))); }); sp.rotation.y = t * .8; core.material.opacity = .95 * a; glow.material.opacity = .35 * a; sp.children.forEach(s => s.material.opacity = .9 * a); };
    g.userData.set(1, 1, 0); return g;
  }
  const WEAPONS = { parole: makeWeapon_parole, aaron: makeWeapon_aaron, fouet: makeWeapon_fouet, fronde: makeWeapon_fronde, berger: makeWeapon_berger, filet: makeWeapon_filet, marteau: makeWeapon_marteau, jericho: makeWeapon_jericho, encensoir: makeWeapon_encensoir, croix: makeWeapon_croix, glaive: makeWeapon_glaive, lampe: makeWeapon_lampe, rameaux: makeWeapon_rameaux };
  function triCount(o) { let n = 0; o.traverse(q => { if (q.isMesh) { const g = q.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return Math.round(n); }
  Object.assign(root, WEAPONS, { WEAPONS, makeFaithRing, weaponTris: triCount, weaponMat: mat });
})(typeof window !== 'undefined' ? window : globalThis);
