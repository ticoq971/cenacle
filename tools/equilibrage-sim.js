/* Simulation d'équilibrage (à coller dans la console du jeu, après tools/equilibrage-mesure.js) : `await simEquilibrage()`.
   Héros « nu » (sans reliques, versets, armure, églises ni armes : on ajoute un coefficient `extra` pour ces bonus) qui farme chaque niveau :
   il attaque l'ennemi le plus fort qu'il peut battre sans risque (indice dgF <= .5), achète Puissance/Vie au plus économe, jusqu'à pouvoir battre le boss (dgF <= 1) après NEEDZ conversions.
   Temps = durée de combat + 7 s de trajet par ennemi. Renvoie, par niveau : temps de farm (min), stats du héros, niveaux d'amélioration, rapports entre paliers.
   Ne touche pas à la sauvegarde (S est restauré). */
window.simEquilibrage = async function (o) {
  o = Object.assign({ extra: 1.35, walk: 7, risk: .5, bossRisk: 1, maxMin: 900, cap: CAP, hit: .6, crit: 1.12 }, o || {});
  const snap = JSON.stringify(S), R = await mesureEquilibrage([...Array(o.upTo === undefined ? 12 : o.upTo + 1).keys()]), out = [], eh = (A, e) => Math.max(A * .05, A - e.hp / 60);
  let prev = null;
  try {
    S.bA = 0; S.bH = 0; S.up = [0, 0, 0, 0]; S.f = 0;
    for (let z = 0; z < R.length; z++) {
      const r = R[z], types = [['pL', r.petitLo], ['pH', r.petitHi], ['mL', r.moyenLo], ['mH', r.moyenHi], ['el', r.elite]].sort((a, b) => a[1].hp * a[1].dmg - b[1].hp * b[1].dmg);
      const cd = foeStat(z, 0, false).cd || 1.2, bcd = foeStat(z, 0, true).cd || 1.1;
      const dg = e => { const A = ATK() / 1 * o.extra, H = HPM() * o.extra, ef = eh(A, e) * o.crit, ttk = e.hp / ef * o.hit; return { f: (ttk / cd + 1) * e.dmg / H, ttk }; };
      const dgB = () => { const A = ATK() * o.extra, H = HPM() * o.extra, e = r.boss, ef = eh(A, e) * o.crit, ttk = e.hp / ef * o.hit; return { f: (ttk / bcd + 1) * e.dmg / H * .55 /* esquive des tirs annoncés */, ttk }; };
      const row = { niveau: z + 1, arrivee: {}, minutes: 0, kills: 0, ups: null };
      const A0 = ATK() * o.extra, H0 = HPM() * o.extra; row.arrivee = { atk: A0, hp: H0 }; types.forEach(([k, e]) => row.arrivee[k] = +dg(e).f.toFixed(2)); row.arrivee.boss = +dgB().f.toFixed(2);
      let t = 0, conv = 0, tFirst = {};
      while (t < o.maxMin * 60) {
        /* achats */
        for (let g = 0; g < 400; g++) { const c0 = upCost(0), c1 = upCost(1), i = (c0 * (S.up[0] + 3) <= c1 * (S.up[1] + 3)) ? 0 : 1, c = i ? c1 : c0; if (S.f < c) break; S.f -= c; S.up[i]++; }
        types.forEach(([k, e]) => { if (tFirst[k] === undefined && dg(e).f <= 1) tFirst[k] = +(t / 60).toFixed(1); });
        const b = dgB(); if (conv >= NEEDZ(z) && b.f <= o.bossRisk) { row.bossMin = +(t / 60).toFixed(1); break; }
        let pick = types[0]; for (const ty of types) if (dg(ty[1]).f <= o.risk) pick = ty;
        const e = pick[1], d = dg(e); t += d.ttk + o.walk; row.kills++;
        const capOk = conv < o.cap; conv++; S.f += e.F * (capOk ? 1 : .5) * (e.F ? 1 : 0); if (capOk) { S.bA += e.a; S.bH += e.h; }
      }
      if (row.bossMin === undefined) row.bossMin = '>' + o.maxMin;
      else { const e = r.boss; S.f += e.F; S.bA += e.a; S.bH += e.h; t += 0; }
      row.minutes = +(t / 60).toFixed(1); row.first = tFirst; row.ups = S.up.slice(); row.fin = { atk: ATK() * o.extra, hp: HPM() * o.extra, bA: S.bA, bH: S.bH };
      row.bossFight = { hp: R[z].boss.hp, dmg: R[z].boss.dmg };
      row.ratio = prev ? { atk: +(row.fin.atk / prev.fin.atk).toFixed(2), hp: +(row.fin.hp / prev.fin.hp).toFixed(2), boss: +(r.boss.hp / R[z - 1].boss.hp).toFixed(2), F: +(r.petitHi.F / R[z - 1].petitHi.F).toFixed(2), cost: +(upCost(0) / prev.cost0).toFixed(2) } : {};
      row.cost0 = upCost(0); prev = row; out.push(row);
    }
  } finally { Object.assign(S, JSON.parse(snap)); }
  return out;
};
window.tableSim = async function (o) {
  const f = v => v >= 1000 ? Math.round(v) : +(+v).toFixed(1);
  return (await simEquilibrage(o)).map(r => 'N' + r.niveau + ' farm ' + r.minutes + ' min (boss ' + r.bossMin + ') kills ' + r.kills + ' | arrivée A' + f(r.arrivee.atk) + ' H' + f(r.arrivee.hp) + ' f(pL ' + r.arrivee.pL + ' pH ' + r.arrivee.pH + ' mL ' + r.arrivee.mL + ' mH ' + r.arrivee.mH + ' el ' + r.arrivee.el + ' boss ' + r.arrivee.boss + ') | fin A' + f(r.fin.atk) + ' H' + f(r.fin.hp) + ' ups ' + r.ups + ' | prem ' + JSON.stringify(r.first) + ' | x' + JSON.stringify(r.ratio)).join('\n');
};

/* Calage automatique des multiplicateurs de boss SCL.bmh / SCL.bmd (niveaux 2 à 12) pour que le boss de chaque niveau demande ~cible minutes de farm au héros simulé. Renvoie les tableaux à recopier dans le code. */
window.calibrerBoss = async function (cible, o) {
  cible = cible || 40; o = Object.assign({ maxMin: 400 }, o || {});
  for (let z = o.from === undefined ? 1 : o.from; z <= (o.to === undefined ? 11 : o.to); z++) {
    let lo = .4, hi = 12, m = SCL.bmh[z] || 1;
    for (let it = 0; it < 9; it++) {
      m = Math.sqrt(lo * hi); SCL.bmh[z] = m; SCL.bmd[z] = m * (SCL.bdr || .9);
      const r = await simEquilibrage(Object.assign({}, o, { upTo: z })), t = r[z].bossMin; const tt = typeof t === 'string' ? 1e9 : t;
      if (tt > cible) hi = m; else lo = m;
    }
    SCL.bmh[z] = +lo.toFixed(2); SCL.bmd[z] = +(lo * (SCL.bdr || .9)).toFixed(2);
  }
  return JSON.stringify({ bmh: SCL.bmh, bmd: SCL.bmd });
};

/* Calage automatique du niveau d'entrée des ennemis EB.rf[z] (niveaux 2 à 12) : à l'arrivée au niveau z, le plus faible petit ennemi doit avoir un indice de danger dgF = cible (défaut .25). À lancer avant calibrerBoss. */
window.calibrerPetits = async function (cible, o) {
  cible = cible || .25; o = Object.assign({ maxMin: 400 }, o || {});
  for (let z = 1; z < 12; z++) {
    let lo = .05, hi = 6;
    for (let it = 0; it < 9; it++) {
      const m = Math.sqrt(lo * hi); EB.rf[z] = m; SCL.bmh[z] = SCL.bmh[z] || 1;
      const r = await simEquilibrage(Object.assign({ upTo: z }, o)), f = r[z].arrivee.pL;
      if (f > cible) hi = m; else lo = m;
    }
    EB.rf[z] = +lo.toFixed(2);
    /* le boss du niveau doit rester battable pour la suite : recalage provisoire du boss */
    let blo = .4, bhi = 12; for (let it = 0; it < 8; it++) { const m = Math.sqrt(blo * bhi); SCL.bmh[z] = m; SCL.bmd[z] = m * (SCL.bdr || .9); const r = await simEquilibrage(Object.assign({ upTo: z }, o)), t = r[z].bossMin; if ((typeof t === 'string' ? 1e9 : t) > (o.cibleBoss || 35)) bhi = m; else blo = m; }
    SCL.bmh[z] = +blo.toFixed(2); SCL.bmd[z] = +(blo * (SCL.bdr || .9)).toFixed(2);
  }
  return JSON.stringify({ rf: EB.rf, bmh: SCL.bmh, bmd: SCL.bmd });
};

/* Test de la migration v7 -> v8 sur des sauvegardes fabriquées (niveaux 1, 5 et 12, anciennes échelles) : `await testMigration()`. N'écrit rien (S est restauré). */
window.testMigration = async function () {
  const snap = JSON.stringify(S), Z = f => Array.from({ length: 12 }, (_, i) => f(i)), mk = o => Object.assign(JSON.parse(snap), { ver: 7 }, o), out = {};
  const tests = {
    N1: mk({ lvl: 0, conv: Z(i => i == 0 ? 12 : 0), boss: Z(() => 0), bA: 3, bH: 20, up: [3, 2, 0, 0], f: 150 }),
    N5: mk({ lvl: 4, conv: Z(i => i < 5 ? 25 : 0), boss: Z(i => i < 4 ? 1 : 0), bA: 700, bH: 2500, up: [14, 13, 0, 0], f: 60000, ch: Z(i => i < 5 ? [1, 0] : [0, 0]) }),
    N12: mk({ lvl: 11, conv: Z(() => 45), boss: Z(i => i < 11 ? 1 : 0), bA: 6e6, bH: 3e7, up: [28, 27, 0, 0], f: 2e9, ch: Z(() => [1, 1]), cl: Z(() => [3, 3]) })
  };
  try { for (const [k, t] of Object.entries(tests)) {
    const m = migrateSave(JSON.parse(JSON.stringify(t))); Object.assign(S, JSON.parse(JSON.stringify(m))); const z = Math.min(m.lvl, 11), r = (await mesureEquilibrage([z]))[0];
    out[k] = { ver: m.ver, bA: +m.bA.toFixed(1), bH: +m.bH.toFixed(1), f: Math.round(m.f), ATK: Math.round(ATK()), HPM: Math.round(HPM()), idempotent: JSON.stringify(migrateSave(JSON.parse(JSON.stringify(m)))) === JSON.stringify(m), boss: Math.round(r.boss.hp) + '/' + Math.round(r.boss.dmg), petit: Math.round(r.petitLo.hp) + '/' + Math.round(r.petitLo.dmg), coutPuissance: upCost(0), conv: m.conv.join(), up: m.up.join() };
    Object.assign(S, JSON.parse(snap)); } } finally { Object.assign(S, JSON.parse(snap)); }
  return JSON.stringify(out);
};

/* Variante contrainte (v27d) : le boss de chaque niveau ne croît pas de plus de ~x1,7 par rapport au précédent ; EB.rf calé pour dgF(petit le plus faible) = cibleF, SCL.bmh calé pour ~cibleT minutes de farm dans la plage autorisée. */
window.calibrerContraint = async function (cibleF, cibleT, o) {
  o = Object.assign({ maxMin: 400 }, o || {}); EB.rf = [1]; SCL.bmh = [1]; SCL.bmd = [1.25];
  for (let z = 1; z < 12; z++) {
    let lo = .05, hi = 40; SCL.bmh[z] = SCL.bmh[z - 1] * 1.05; SCL.bmd[z] = SCL.bmh[z] * .9;
    for (let it = 0; it < 9; it++) { const m = Math.sqrt(lo * hi); EB.rf[z] = m; const r = await simEquilibrage(Object.assign({}, o, { upTo: z })); if (r[z].arrivee.pL > cibleF) hi = m; else lo = m; }
    EB.rf[z] = +lo.toFixed(2);
    const prev = SCL.bmh[z - 1]; let blo = prev * .9, bhi = prev * 1.13;
    for (let it = 0; it < 7; it++) { const m = (blo + bhi) / 2; SCL.bmh[z] = m; SCL.bmd[z] = m * .9; const r = await simEquilibrage(Object.assign({}, o, { upTo: z })), t = r[z].bossMin; if ((typeof t === 'string' ? 1e9 : t) > cibleT) bhi = m; else blo = m; }
    SCL.bmh[z] = +blo.toFixed(2); SCL.bmd[z] = +(blo * .9).toFixed(2);
  }
  return JSON.stringify({ rf: EB.rf, bmh: SCL.bmh, bmd: SCL.bmd });
};
