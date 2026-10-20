/**
 * Second pass : force les meilleures images wiki pour les formes iconiques.
 * À lancer après refresh-images.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'js/data/shinobi-all.json');
const CACHE = path.join(ROOT, 'scripts/.wiki-image-cache.json');
const WIKI = 'https://naruto.fandom.com/api.php';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wiki(params) {
  const url = new URL(WIKI);
  url.search = new URLSearchParams({ format: 'json', origin: '*', ...params }).toString();
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ShinobiiiiImageBot/1.0' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function resolveFileUrl(filename) {
  const data = await wiki({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|size',
  });
  const page = Object.values(data.query?.pages || {})[0];
  return page?.imageinfo?.[0]?.url || null;
}

async function pageFiles(title) {
  try {
    const data = await wiki({ action: 'parse', page: title, prop: 'images' });
    return data.parse?.images || [];
  } catch {
    return [];
  }
}

function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/[ūû]/g, 'u')
    .replace(/[ōô]/g, 'o')
    .replace(/[āâ]/g, 'a')
    .replace(/[ēê]/g, 'e')
    .replace(/[īî]/g, 'i');
}

function findFile(files, candidates) {
  for (const c of candidates) {
    const want = norm(c);
    const hit = files.find((f) => norm(f) === want);
    if (hit) return hit;
  }
  for (const c of candidates) {
    const key = norm(c).replace(/\.png$/i, '').replace(/_/g, ' ');
    const hit = files.find((f) => norm(f).replace(/_/g, ' ').includes(key.slice(0, 16)));
    if (hit) return hit;
  }
  return null;
}

/** baseName → formId → candidats fichiers wiki (ordre de préférence) */
const CURATED = {
  'Naruto Uzumaki': {
    _page: 'Naruto Uzumaki',
    enfant: ['Naruto_Part_I.png'],
    ado: ['Naruto_Part_II.png'],
    ermite: ["Naruto's_Sage_Mode.png", 'Naruto_using_Sage_Mode.png'],
    kyuubi1: ['Version_1_form.png', 'Naruto_transforming.png'],
    kyuubi2: ['Naruto_Kyūbi_Chakra_Mode.png', 'Asura_Kurama_Mode.png'],
    bijuu: ["Naruto's_tailed_beast_mode.png"],
    ashura: ['Asura_Kurama_Mode.png', 'Naruto_six_paths.png'],
    hokage: ['Naruto_Part_III.png', 'Naruto_epilogue.PNG'],
    baryon: ["Naruto's_Baryon_Mode.png"],
  },
  'Sasuke Uchiha': {
    _page: 'Sasuke Uchiha',
    enfant: ['Sasuke_Part_I.png', 'Sasuke_Part_1.png'],
    mark: ['Sasuke_Cursed_Mode.png', 'Sasuke_CS2.png'],
    hebi: ['Sasuke_Part_II.png', 'Sasuke_Part_2.png'],
    ms: ["Sasuke's_Mangekyo.png", "Sasuke's_Awakened_Mangekyou_Sharingan.PNG"],
    ems: ["Sasuke's_Eternal_Mangekyo.png", 'Sasuke_EMS.png'],
    rinnegan: ['Sasuke_-_Rinnegan.png', "Sasuke's_Rinnegan.png"],
    adult: ['Sasuke_Part_III.png', 'Sasuke_Part_3.png', 'Sasuke_epilogue.PNG'],
  },
  'Sakura Haruno': {
    _page: 'Sakura Haruno',
    enfant: ['Sakura_Part_I.png', 'Sakura_Part_1.png'],
    ship: ['Sakura_Part_I_long_hair.png', 'Sakura_Part_II.png'],
    byakugou: ['Tsunade&Sakura_Byakugo_no_In.png', 'Sakura_Byakugou.png'],
    adult: ['Sakura_Part_III.png', 'Adult_Sakura.png', 'Sakura_-_The_Last.png'],
  },
  'Kakashi Hatake': {
    _page: 'Kakashi Hatake',
    anbu: ['Kakashi_Anbu.png', 'Kakashi_ANBU_uniform.png'],
    jonin: ['Kakashi_full.png', 'Kakashi_Hatake.png'],
    ms: ["Kakashi's_Mangekyō_Sharingan.png"],
    dharmac: ["Kakashi's_Susanoo.png", 'Kakashi_Double_MS.png'],
    hokage: ['Hokage_Kakashi.png', 'HokageKakashi.png', 'Kakashi_Part_III.png'],
  },
  Gaara: {
    _page: 'Gaara',
    enfant: ['Gaara_in_Part_I.png', 'Gaara_first_Part_I.png', 'Full_Shukaku_Gaara.png'],
    kazekage: ['Gaara_Part_II.png'],
    war: ['Gaara_Part_II.png'],
    adult: ['Gaara_Part_III.png'],
  },
  'Itachi Uchiha': {
    _page: 'Itachi Uchiha',
    anbu: ['Itachi_ANBU_Online.png', 'Uchiha_Anbu.png'],
    akatsuki: ['Itachi.png', 'Itachi_Uchiha.png'],
    edo: ['Edo_Itachi_NXB.png'],
  },
  'Madara Uchiha': {
    _page: 'Madara Uchiha',
    edo: ['Madara_fullbody.png'],
    rinnegan: ["Madara's_Rinnegan_.png", 'Madara_Awakening_Rinnegan.png'],
    jubii: ['Madara_and_Obito_Ten-Tails.png'],
  },
  Tobi: {
    _page: 'Obito Uchiha',
    tobi: ['Obito_as_the_Masked_Man.png', 'Obito_Uchiha_-_Akatsuki.png'],
    obito: ['Obito_Uchiha.png', 'ObitoWar.png'],
    jinchuriki: ['Madara_and_Obito_Ten-Tails.png', 'ObitoWar.png'],
    edo: ['Obito_Uchiha_full.png'],
  },
  Jiraya: {
    _page: 'Jiraiya',
    sannin: ['Jiraiya_full2.png', 'Jiraiya_Young_Adult.png'],
    jonin: ['Jiraiya_full2.png'],
    ermite: ['Sage_mode.png'],
    edo: ['Jiraiya_full2.png'],
  },
  Pain: {
    _page: 'Nagato',
    deva: ['Yahiko_Turned_Deva.png', 'Pain_And_Konan.PNG', 'Six_Paths_Pain.png'],
    six: ['Six_Paths_Pain.png', 'Nagato.png'],
  },
  'Minato Namikaze': {
    _page: 'Minato Namikaze',
    jonin: ['Minato_full.png'],
    hokage: ['Minato_becomes_hokage.png', 'Minato_full.png'],
    kyuubi: ["Minato's_Chakra_Mode.png"],
  },
  'Hinata Hyûga': {
    _page: 'Hinata Hyūga',
    enfant: ['Hinata.png', 'Hinata_Part_I.png'],
    ship: ['Hinata_Part_II.png'],
    war: ['Hinata_Part_II.png'],
    adult: ['Hinata_-_The_Last.png'],
  },
  'Guy Might': {
    _page: 'Might Guy',
    jonin: ['Might_Guy.png', 'Might_Guy_Part_III.png'],
    gates5: ["Guy_Opening_7th_Gate.png", "Guy's_Eight_Inner_Gates.png"],
    gates8: ["Guy's_Eight_Inner_Gates.png"],
  },
  'Rock Lee': {
    _page: 'Rock Lee',
    genin: ['Rock_Lee.png', 'Rock_Lee_Part_I.png'],
    gates5: ["Lee's_Eight_Inner_Gates.png", 'Rock_Lee.png'],
    gates8: ["Lee's_Eight_Inner_Gates.png"],
    adult: ['Rock_Lee_Part_III.png', 'Rock_Lee.png'],
  },
  'Killer Bee': {
    _page: 'Killer B',
    jinchuriki: ['Killer_B.png', 'Killer_B_Part_III.png'],
    v2: ["Killer_B's_Tailed_Beast_Mode.png"],
    full: ["Killer_B's_Tailed_Beast_Mode.png"],
  },
  'Kaguya Ootsutsuki': {
    _page: 'Kaguya Ōtsutsuki',
    rabbit: ['Kaguya_full_appearance.png'],
    ash: ['Kaguya_full_appearance.png'],
  },
  'Boruto Uzumaki': {
    _page: 'Boruto Uzumaki',
    academy: ['Boruto_Uzumaki.png', 'Boruto.png'],
    genin: ['Boruto_Uzumaki.png'],
    karma: ['Boruto_Karma.png', 'Boruto_Uzumaki.png'],
    otsutsuki: ['Boruto_Uzumaki.png'],
  },
  Kawaki: {
    _page: 'Kawaki',
    karma: ['Kawaki.png'],
    vessel: ['Kawaki.png'],
    adult: ['Kawaki.png'],
  },
  'Hashirama Senju': {
    _page: 'Hashirama Senju',
    hokage: ['Hashirama_Senju.png'],
    sage: ['Hashirama_Sage_Mode.png', 'Hashirama_Senju.png'],
    edo: ['Hashirama_Senju.png'],
  },
  'Tsunade Senju': {
    _page: 'Tsunade',
    sannin: ['Tsunade.png', 'Tsunade_full.png'],
    hokage: ['Tsunade.png'],
    war: ['Tsunade.png'],
  },
  Orochimaru: {
    _page: 'Orochimaru',
    sannin: ['Orochimaru.png'],
    otogakure: ['Orochimaru.png'],
    war: ['Orochimaru.png'],
  },
  Konan: {
    _page: 'Konan',
    akatsuki: ['Konan.png', 'Pain_And_Konan.PNG'],
    angel: ['Konan.png'],
  },
  'Kisame Hoshigaki': {
    _page: 'Kisame Hoshigaki',
    anbu: ['Kisame.png'],
    akatsuki: ['Kisame.png'],
    samehada: ['Kisame.png'],
  },
};

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : { pages: {}, files: {} };
cache.files ||= {};
cache.pages ||= {};

let applied = 0;
let missing = [];

for (const [baseName, conf] of Object.entries(CURATED)) {
  const page = conf._page;
  let files = cache.pages[page];
  if (!files?.length) {
    files = await pageFiles(page);
    cache.pages[page] = files;
    await sleep(300);
  }
  console.log(baseName, 'files', files.length);

  for (const [formId, candidates] of Object.entries(conf)) {
    if (formId === '_page') continue;
    const file = findFile(files, candidates);
    if (!file) {
      missing.push(`${baseName}/${formId}: ${candidates[0]}`);
      continue;
    }
    if (!cache.files[file]) {
      const url = await resolveFileUrl(file);
      await sleep(220);
      if (url) cache.files[file] = url;
    }
    const url = cache.files[file];
    if (!url) {
      missing.push(`${baseName}/${formId}: resolve fail ${file}`);
      continue;
    }
    for (const s of data) {
      if (s.baseName === baseName && s.formId === formId) {
        s.image = url;
        s.imageSource = 'narutopedia-curated';
        s.imageFile = file;
        applied++;
      }
    }
  }
}

writeFileSync(CACHE, JSON.stringify(cache, null, 2));
writeFileSync(DATA, JSON.stringify(data, null, 2));
const unique = new Set(data.map((s) => s.image)).size;
console.log({ applied, uniqueImages: unique, missing: missing.slice(0, 40), missingCount: missing.length });
