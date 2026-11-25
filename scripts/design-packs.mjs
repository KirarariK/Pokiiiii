#!/usr/bin/env node
// Aide à la conception des grilles de packs.
//
//   node scripts/design-packs.mjs
//
// Pour chaque pack (prix, paliers de cote, thème éventuel), propose des
// probabilités en progression géométrique telles que le retour en revente
// immédiate atteigne la cible du pack (target).
// Les valeurs retenues sont ensuite recopiées dans js/data/packs.js.
import { tierPool, CARDS } from '../js/catalog.js';
const VINTAGE = ['base1','base2','base3','base5','gym1','gym2','neo1','neo2','neo3','neo4'];
const EEVEE = /(Eevee|Vaporeon|Jolteon|Flareon|Espeon|Umbreon|Leafeon|Glaceon|Sylveon)/;
// target : retour visé en revente immédiate à 90 %. La cote moyenne visée vaut donc prix × target / 0,9.
const specs = [
  { slug: 'starter', price: 995, target: 0.88, ranges: [[4,6],[7,9],[10,15],[16,25],[26,50],[51,300]] },
  { slug: 'evoli', price: 1990, target: 0.89, filter: { names: EEVEE }, ranges: [[5,9],[10,19],[20,39],[40,79],[80,159],[160,650]] },
  { slug: 'pro', price: 2495, target: 0.90, ranges: [[10,15],[16,25],[26,45],[46,99],[100,249],[250,500]] },
  { slug: 'retro', price: 2990, target: 0.89, filter: { sets: VINTAGE }, ranges: [[10,15],[16,25],[26,50],[51,99],[100,199],[200,650]] },
  { slug: 'brasier', price: 3990, target: 0.86, filter: { types: ['Fire'] }, ranges: [[16,25],[26,49],[50,99],[100,199],[200,299],[300,650]] },
  { slug: 'master', price: 4995, target: 0.90, ranges: [[20,29],[30,49],[50,79],[80,149],[150,299],[300,650]] },
  { slug: 'expert', price: 9995, target: 0.91, ranges: [[40,59],[60,99],[100,149],[150,249],[250,449],[450,1050]] },
  { slug: 'legende', price: 24900, target: 0.92, ranges: [[100,149],[150,199],[200,299],[300,449],[450,649],[650,1600]] },
];
const meanOf = (pool) => { const fl = Math.min(...pool.map(c => c.value)); const w = pool.map(c => fl / c.value); const W = w.reduce((a,b)=>a+b,0); return pool.reduce((a,c,i)=>a+c.value*w[i],0)/W; };
for (const s of specs) {
  const pack = { slug: s.slug, filter: s.filter, tiers: s.ranges.map(([min,max]) => ({ min, max, p: 0 })) };
  const pools = pack.tiers.map((_, i) => tierPool(pack, i));
  const means = pools.map(p => p.length ? meanOf(p) : NaN);
  const ev = (r) => { const w = means.map((_, i) => Math.pow(r, i)); const W = w.reduce((a,b)=>a+b,0); return means.reduce((a,m,i)=>a+m*w[i]/W,0); };
  let lo = 0.05, hi = 1.5;
  const goal = s.price * s.target / 0.9;
  for (let k = 0; k < 60; k++) { const mid = (lo+hi)/2; if (ev(mid) < goal) lo = mid; else hi = mid; }
  const r = (lo+hi)/2; const w = means.map((_, i) => Math.pow(r, i)); const W = w.reduce((a,b)=>a+b,0);
  let ps = w.map(x => Math.round(x/W*1000)/10);
  ps[0] = Math.round((100 - ps.slice(1).reduce((a,b)=>a+b,0))*10)/10;
  const evR = means.reduce((a,m,i)=>a+m*ps[i]/100,0);
  console.log(`${s.slug.padEnd(8)} prix ${(s.price/100).toFixed(2).padStart(6)} r=${r.toFixed(3)} | tailles ${pools.map(p=>p.length).join('/')} | moyennes ${means.map(m=>(m/100).toFixed(0)).join('/')} | p ${ps.join(' / ')} | EV ${(evR/100).toFixed(2)} retour ${(evR*0.9/s.price*100).toFixed(1)}% (cible ${(s.target*100).toFixed(0)}%)`);
}
console.log(CARDS.length, 'cartes; max', CARDS[0].name, CARDS[0].value/100);
