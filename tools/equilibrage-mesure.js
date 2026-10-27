/* Mesure de l'équilibrage (à coller dans la console du jeu chargé, puis `await mesureEquilibrage()`).
   Pour chaque niveau : stats réelles des ennemis (spawnFoe + diffApply), récompenses (F, Puissance, Vie), boss, coûts.
   Ne modifie pas la sauvegarde (les ennemis de mesure sont retirés). */
window.mesureEquilibrage = async function (zs) {
  const out = [], save0 = JSON.stringify(S); PX.forEach(x => { if (x) x._rr = null; }); /* le cache de référence des récompenses dépend des réglages EB / SCL */
  const rec = e => { const b = bonusOf(e.zn, e.boss ? 3 : e.kind), rm = (e.rewM || 1);
    return { hp: e.max, dmg: e.dmg, F: foeRew(e), a: b.a * rm * (e.eba || 1), h: b.h * rm * (e.ebh || 1) }; };
  for (const z of (zs || [...Array(12).keys()])) {
    const L = slotsOf(z).slice().sort((a, b) => a.p - b.p), lo = L[0], hi = L[L.length - 1], mid = L[L.length >> 1], r = { z };
    const sp = (kind, q, el) => { const e = spawnFoe(z, false, kind, q.x, q.z, undefined, el); const o = rec(e); scene.remove(e.m); if (e.el) e.el.remove(); enemies.splice(enemies.indexOf(e), 1); return o; };
    r.petitLo = sp(0, lo); r.petitHi = sp(0, hi); r.moyenLo = sp(1, lo); r.moyenHi = sp(1, hi); r.archer = sp(4, mid); r.legion = sp(8, hi); r.centLo = sp(14, lo); r.centHi = sp(14, hi); r.elite = sp(1, hi, 1);
    const be = spawnFoe(z, true, 0, lo.x, lo.z); r.boss = rec(be); scene.remove(be.m); if (be.el) be.el.remove(); enemies.splice(enemies.indexOf(be), 1);
    r.k = K(z); r.costChurch0 = CCOST(z, 0); r.costApo0 = apCost(z, 0); r.need = NEEDZ(z);
    out.push(r);
  }
  return out;
};
/* Tableau lisible : await tableEquilibrage() */
window.tableEquilibrage = async function (zs) {
  const R = await mesureEquilibrage(zs), f = v => v >= 1000 ? Math.round(v) : +v.toFixed(1), g = o => f(o.hp) + '/' + f(o.dmg) + ' F' + f(o.F);
  return R.map((r, i) => 'N' + (r.z + 1) + ' | pL ' + g(r.petitLo) + ' a' + f(r.petitLo.a) + ' | pH ' + g(r.petitHi) + ' | mL ' + g(r.moyenLo) + ' | mH ' + g(r.moyenHi) + ' h' + f(r.moyenHi.h) + ' | el ' + g(r.elite) + ' | boss ' + g(r.boss) + ' a' + f(r.boss.a) + ' h' + f(r.boss.h) + ' | cEgl ' + r.costChurch0 + ' cApo ' + r.costApo0 + ' n' + r.need).join('\n');
};
