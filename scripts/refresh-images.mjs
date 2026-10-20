/**
 * Remplace les images AniList (souvent 1 seule par perso) par des images
 * Narutopedia (Fandom) HQ, idéalement une image différente par forme/mode.
 *
 * Usage: node scripts/refresh-images.mjs
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
    headers: { 'User-Agent': 'ShinobiiiiImageBot/1.0 (fan-game; local)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`wiki HTTP ${res.status}`);
  return res.json();
}

/** Noms FR / AniList → titre page wiki EN */
const NAME_TO_WIKI = {
  'Naruto Uzumaki': 'Naruto Uzumaki',
  'Sasuke Uchiha': 'Sasuke Uchiha',
  'Sakura Haruno': 'Sakura Haruno',
  'Kakashi Hatake': 'Kakashi Hatake',
  'Boruto Uzumaki': 'Boruto Uzumaki',
  'Sarada Uchiha': 'Sarada Uchiha',
  'Mitsuki': 'Mitsuki',
  'Kawaki': 'Kawaki',
  'Gaara': 'Gaara',
  'Itachi Uchiha': 'Itachi Uchiha',
  'Rock Lee': 'Rock Lee',
  'Guy Might': 'Might Guy',
  'Hinata Hyûga': 'Hinata Hyūga',
  'Neji Hyûga': 'Neji Hyūga',
  'Shikamaru Nara': 'Shikamaru Nara',
  'Ino Yamanaka': 'Ino Yamanaka',
  'Chôji Akimichi': 'Chōji Akimichi',
  'Kiba Inuzuka': 'Kiba Inuzuka',
  'Shino Aburame': 'Shino Aburame',
  'Tenten': 'Tenten',
  'Temari': 'Temari',
  'Kankurô': 'Kankurō',
  'Jiraya': 'Jiraiya',
  'Jiraiya': 'Jiraiya',
  'Tsunade Senju': 'Tsunade',
  'Orochimaru': 'Orochimaru',
  'Kabuto Yakushi': 'Kabuto Yakushi',
  'Minato Namikaze': 'Minato Namikaze',
  'Kushina Uzumaki': 'Kushina Uzumaki',
  'Hashirama Senju': 'Hashirama Senju',
  'Tobirama Senju': 'Tobirama Senju',
  'Hiruzen Sarutobi': 'Hiruzen Sarutobi',
  'Madara Uchiha': 'Madara Uchiha',
  'Tobi': 'Obito Uchiha',
  'Pain': 'Pain',
  'Konan': 'Konan',
  'Kisame Hoshigaki': 'Kisame Hoshigaki',
  'Deidara': 'Deidara',
  'Sasori': 'Sasori',
  'Hidan': 'Hidan',
  'Kakuzu': 'Kakuzu',
  'Killer Bee': 'Killer B',
  'Yamato': 'Yamato',
  'Sai': 'Sai',
  'Karin': 'Karin',
  'Suigetsu Houzuki': 'Suigetsu Hōzuki',
  'Jûgo': 'Jūgo',
  'Kimimaro Kaguya': 'Kimimaro',
  'Zabuza Momochi': 'Zabuza Momochi',
  'Haku': 'Haku (shinobi)',
  'Konohamaru Sarutobi': 'Konohamaru Sarutobi',
  'Asuma Sarutobi': 'Asuma Sarutobi',
  'Kurenai Yuuhi': 'Kurenai Yūhi',
  'Shizune': 'Shizune',
  'Anko Mitarashi': 'Anko Mitarashi',
  'Danzou Shimura': 'Danzō Shimura',
  'Shisui Uchiha': 'Shisui Uchiha',
  'Mei Terumî': 'Mei Terumī',
  'A (Raikage)': 'A (Fourth Raikage)',
  'Ônoki': 'Ōnoki',
  'Oonoki': 'Ōnoki',
  'Kaguya Ootsutsuki': 'Kaguya Ōtsutsuki',
  'Hagoromo Ootsutsuki': 'Hagoromo Ōtsutsuki',
  'Momoshiki Ootsutsuki': 'Momoshiki Ōtsutsuki',
  'Kinshiki Ootsutsuki': 'Kinshiki Ōtsutsuki',
  'Urashiki Ootsutsuki': 'Urashiki Ōtsutsuki',
  'Toneri Ootsutsuki': 'Toneri Ōtsutsuki',
  'Hamura Ootsutsuki': 'Hamura Ōtsutsuki',
  'Indra Ootsutsuki': 'Indra Ōtsutsuki',
  'Ashura Ootsutsuki': 'Asura Ōtsutsuki',
  'Jigen': 'Jigen',
  'Code': 'Code (Kara)',
  'Delta': 'Delta',
  'Boro': 'Boro',
  'Amado': 'Amado',
  'Eida': 'Eida',
  'Daemon': 'Daemon',
  'Yahiko': 'Yahiko',
  'Chojuro': 'Chōjūrō',
  'Darui': 'Darui',
  'Kurotsuchi': 'Kurotsuchi',
  'Shikadai Nara': 'Shikadai Nara',
  'Inojin Yamanaka': 'Inojin Yamanaka',
  'Himawari Uzumaki': 'Himawari Uzumaki',
  'Iruka Umino': 'Iruka Umino',
  'Hanabi Hyuuga': 'Hanabi Hyūga',
  'Fugaku Uchiha': 'Fugaku Uchiha',
  'Mikoto Uchiha': 'Mikoto Uchiha',
  'Third Raikage': 'A (Third Raikage)',
};

/** Mots-clés fichier wiki (minuscules) scorés par formId */
const FORM_KEYWORDS = {
  enfant: ['part_i', 'part i', 'part1', 'young', 'child', 'academy', 'genin', 'kid'],
  academy: ['academy', 'part_i', 'part i', 'young'],
  genin: ['part_i', 'part i', 'genin', 'young'],
  chunin: ['chunin', 'chūnin', 'part_i', 'exam'],
  jonin: ['jonin', 'jōnin', 'part_ii', 'part ii'],
  anbu: ['anbu', 'anbu_'],
  ship: ['part_ii', 'part ii', 'shippuden', 'part2'],
  ado: ['part_ii', 'part ii', 'shippuden', 'teen'],
  adult: ['part_iii', 'the_last', 'epilogue', 'adult', 'hokage', 'boruto', 'new_era'],
  hokage: ['hokage', 'part_iii', 'epilogue', 'the_last', 'seventh'],
  kazekage: ['kazekage', 'part_ii', 'part ii'],
  ermite: ['sage_mode', 'sage mode', 'sage', 'senjutsu', 'toad', 'hermit', 'sennin', 'mount_myoboku', 'frog'],
  sage: ['sage_mode', 'sage mode', 'sage', 'senjutsu', 'hermit', 'snake_sage', 'toad'],
  kyuubi1: ['version_1', 'version 1', 'v1', 'four-tailed', 'four tailed', 'transforming', 'cloak', 'kyubi', 'kyuubi', 'nine-tails_chakra', 'dark_naruto'],
  kyuubi2: ['version_2', 'version 2', 'v2', 'six-tailed', 'chakra_mode', 'kurama_mode', 'kcm', 'nine-tails_chakra_mode'],
  bijuu: ['tailed_beast_mode', 'bijuu', 'bijū', 'kurama', 'full_form', 'nine-tails', 'bijuu_mode'],
  ashura: ['six_paths', 'six paths', 'ashura', 'asura', 'spsm', 'truth-seeking', 'six_paths_sage'],
  baryon: ['baryon'],
  ms: ['mangekyo', 'mangekyō', 'susanoo', 'sharingan'],
  ems: ['eternal', 'ems', 'mangekyo', 'mangekyō'],
  rinnegan: ['rinnegan', 'six_paths'],
  mark: ['cursed_seal', 'cursed seal', 'mark', 'heaven'],
  hebi: ['hebi', 'taka', 'akatsuki_robe', 'cloak'],
  byakugou: ['byakugou', 'byakugō', 'strength_of_a_hundred', 'forehead', 'medical'],
  gates5: ['gate', 'gates', 'eight_gates', 'inner_gates', 'opened'],
  gates8: ['eight_gates', '8th', 'evening_elephant', 'night_guy', 'gates'],
  edo: ['edo', 'reanimation', 'impure', 'revived'],
  susanoo: ['susanoo', 'susano'],
  sixpaths: ['six_paths', 'six paths', 'rinnegan'],
  tobi: ['tobi', 'mask', 'orange_mask', 'spiral'],
  obito: ['obito', 'unmasked', 'white_mask'],
  jinchuriki: ['jinchuriki', 'jinchūriki', 'tailed', 'bijuu', 'host'],
  v2: ['version_2', 'version 2', 'v2', 'cloak'],
  full: ['full', 'complete', 'tailed_beast', 'gyuki', 'gyūki'],
  karma: ['karma', 'kama', 'vessel'],
  otsutsuki: ['otsutsuki', 'ōtsutsuki', 'horns'],
  war: ['war', 'alliance', 'fourth_shinobi', 'battlefield'],
  akatsuki: ['akatsuki', 'cloak', 'clouds'],
  kage: ['kage', 'hokage', 'kazekage', 'raikage', 'mizukage', 'tsuchikage'],
  sannin: ['sannin', 'legendary'],
  otogakure: ['oto', 'snake', 'orochimaru'],
  spy: ['kabuto', 'glasses', 'medic'],
  snake: ['sage', 'snake', 'white'],
  demon: ['demon', 'mist', 'zabuza', 'sword'],
  mirrors: ['ice', 'mirror', 'crystal', 'haku'],
  root: ['root', 'danzo', 'danzō', 'shimura'],
  sharingan: ['sharingan', 'eye'],
  mizukage: ['mizukage', 'mei'],
  raikage: ['raikage', 'lightning'],
  tsuchikage: ['tsuchikage', 'onoki', 'ōnoki'],
  mokuton: ['wood', 'mokuton'],
  true: ['true_form', 'puppet', 'hiruko'],
  hiruko: ['hiruko'],
  ritual: ['jashin', 'ritual', 'scythe'],
  masks: ['mask', 'heart', 'kakuzu'],
  c4: ['c4', 'clay', 'explosion', 'deidara'],
  angel: ['paper', 'angel', 'konan'],
  fused: ['fused', 'fusion', 'kinshiki'],
  vessel: ['vessel', 'karma', 'jigen'],
  isshiki: ['isshiki'],
  limit: ['claw', 'code', 'limit'],
  core: ['core', 'boro'],
  rabbit: ['kaguya', 'rabbit', 'goddess'],
  ash: ['ash_bone', 'rabbit', 'kaguya'],
  spirit: ['hagoromo', 'sage_of_six'],
  adamantine: ['chain', 'adamantine', 'kushina'],
  kyuubi: ['kyubi', 'kyuubi', 'kurama', 'nine'],
  six: ['six_paths', 'deva', 'pain'],
  deva: ['deva', 'pain', 'yahiko'],
  base: ['part_ii', 'part ii', 'portrait', 'infobox'],
};

/** Overrides exacts fichier wiki pour formes iconiques (priorité max). */
const CURATED = {
  'Naruto Uzumaki': {
    enfant: 'Naruto_Part_I.png',
    ado: 'Naruto_Part_II.png',
    ermite: 'Naruto_using_Sage_Mode.png',
    kyuubi1: 'Version_1_form.png',
    kyuubi2: 'Naruto_Kyūbi_Chakra_Mode.png',
    bijuu: "Naruto's_tailed_beast_mode.png",
    ashura: 'Naruto_six_paths.png',
    hokage: 'Naruto_Part_III.png',
    baryon: "Naruto's_Baryon_Mode.png",
  },
  'Sasuke Uchiha': {
    enfant: 'Sasuke_Part_I.png',
    mark: 'Sasuke_CS2.png',
    hebi: 'Sasuke_Part_II.png',
    ms: 'Sasuke_Mangekyō_Sharingan.png',
    ems: 'Sasuke_EMS.png',
    rinnegan: 'Sasuke_Rinnegan.png',
    adult: 'Sasuke_Part_III.png',
  },
  'Sakura Haruno': {
    enfant: 'Sakura_Part_I.png',
    ship: 'Sakura_Part_II.png',
    byakugou: 'Sakura_Byakugou.png',
    adult: 'Sakura_Part_III.png',
  },
  'Kakashi Hatake': {
    anbu: 'Kakashi_ANBU.png',
    jonin: 'Kakashi_Hatake.png',
    ms: 'Kakashi_Mangekyō_Sharingan.png',
    dharmac: 'Kakashi_Double_MS.png',
    hokage: 'Kakashi_Hokage.png',
  },
};

function resolveCurated(baseName, formId, files) {
  const map = CURATED[baseName];
  if (!map?.[formId]) return null;
  const want = map[formId].toLowerCase();
  const hit =
    files.find((f) => f.toLowerCase() === want) ||
    files.find((f) => f.toLowerCase().replace(/ū/g, 'u').replace(/ō/g, 'o') === want.replace(/ū/g, 'u').replace(/ō/g, 'o')) ||
    files.find((f) => f.toLowerCase().includes(want.replace('.png', '').slice(0, 14)));
  return hit || null;
}

function scoreFile(filename, formId) {
  const f = filename.toLowerCase().replace(/\s+/g, '_');
  // ignore junk
  if (
    /svg|icon|symbol|logo|camera|browse|gender|astrological|nature_icon|infobox_icon|placeholder|signature/i.test(
      f,
    )
  ) {
    return -100;
  }
  const keys = FORM_KEYWORDS[formId] || FORM_KEYWORDS.base;
  let score = 0;
  for (const k of keys) {
    if (f.includes(k.replace(/\s+/g, '_')) || f.includes(k)) score += 10;
  }
  // Prefer clean character portraits
  if (/part_i\b|part_ii\b|part_iii\b/.test(f)) score += 3;
  if (/full|portrait|profile/.test(f)) score += 2;
  // Prefer png over gif
  if (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp')) score += 1;
  if (f.endsWith('.gif')) score -= 5;
  return score;
}

function pickBest(files, formId, used, baseName) {
  const curated = resolveCurated(baseName, formId, files);
  if (curated && !used.has(curated)) return curated;
  if (curated) return curated; // allow reuse if needed

  const ranked = files
    .map((name) => ({ name, score: scoreFile(name, formId) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  for (const r of ranked) {
    if (!used.has(r.name)) return r.name;
  }
  // fallback: any unused decent image
  for (const name of files) {
    if (scoreFile(name, 'base') > -50 && !used.has(name)) return name;
  }
  return ranked[0]?.name || files.find((n) => scoreFile(n, 'base') > -50) || null;
}

async function pageImages(title) {
  const data = await wiki({ action: 'parse', page: title, prop: 'images' });
  if (data.error) throw new Error(data.error.info || JSON.stringify(data.error));
  return data.parse?.images || [];
}

async function resolveFileUrl(filename) {
  const data = await wiki({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
  });
  const pages = data.query?.pages || {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) return null;
  // Prefer latest revision full URL; optionally scale
  return {
    url: info.url,
    width: info.width,
    height: info.height,
    mime: info.mime,
  };
}

async function searchWikiTitle(name) {
  const data = await wiki({
    action: 'query',
    list: 'search',
    srsearch: name,
    srnamespace: 0,
    srlimit: 5,
  });
  const hits = data.query?.search || [];
  if (!hits.length) return null;
  // Prefer exact-ish
  const exact = hits.find((h) => h.title.toLowerCase() === name.toLowerCase());
  return (exact || hits[0]).title;
}

function loadCache() {
  if (existsSync(CACHE)) {
    try {
      return JSON.parse(readFileSync(CACHE, 'utf8'));
    } catch {
      return { pages: {}, files: {} };
    }
  }
  return { pages: {}, files: {} };
}

function saveCache(cache) {
  writeFileSync(CACHE, JSON.stringify(cache, null, 2));
}

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const cache = loadCache();

const byBase = new Map();
for (const s of data) {
  if (!byBase.has(s.baseName)) byBase.set(s.baseName, []);
  byBase.get(s.baseName).push(s);
}

let updated = 0;
let formsWithUnique = 0;
let failed = 0;
const failures = [];

const bases = [...byBase.keys()];
console.log(`Refreshing images for ${bases.length} characters / ${data.length} forms…`);

for (let i = 0; i < bases.length; i++) {
  const baseName = bases[i];
  const forms = byBase.get(baseName);
  let wikiTitle = NAME_TO_WIKI[baseName] || baseName;

  try {
    if (!cache.pages[wikiTitle]) {
      // try direct, then search
      let imgs = [];
      try {
        imgs = await pageImages(wikiTitle);
        await sleep(250);
      } catch {
        const found = await searchWikiTitle(baseName.replace(/û|ū/g, 'u').replace(/ô|ō/g, 'o'));
        await sleep(250);
        if (found) {
          wikiTitle = found;
          imgs = await pageImages(wikiTitle);
          await sleep(250);
        }
      }
      cache.pages[wikiTitle] = imgs;
      if (i % 10 === 0) saveCache(cache);
    }

    const files = cache.pages[wikiTitle] || [];
    if (!files.length) {
      failed++;
      failures.push(baseName);
      continue;
    }

    const used = new Set();
    // Prefer different images per form
    for (const form of forms) {
      const pick = pickBest(files, form.formId || 'base', used, baseName);
      if (!pick) continue;
      used.add(pick);

      const cacheKey = pick;
      if (!cache.files[cacheKey]) {
        const info = await resolveFileUrl(pick);
        await sleep(200);
        if (info?.url) cache.files[cacheKey] = info.url;
      }
      const url = cache.files[cacheKey];
      if (url && url !== form.image) {
        form.image = url;
        form.imageSource = 'narutopedia';
        form.imageFile = pick;
        updated++;
      } else if (url) {
        form.image = url;
        form.imageSource = 'narutopedia';
        form.imageFile = pick;
      }
    }
    if (used.size > 1) formsWithUnique++;
  } catch (err) {
    failed++;
    failures.push(`${baseName}: ${err.message}`);
    await sleep(500);
  }

  if (i % 25 === 0) {
    console.log(`[${i + 1}/${bases.length}] ${baseName} — updated so far ${updated}`);
    saveCache(cache);
  }
}

saveCache(cache);
writeFileSync(DATA, JSON.stringify(data, null, 2));

const uniqueImgs = new Set(data.map((s) => s.image)).size;
console.log('DONE');
console.log({
  forms: data.length,
  uniqueImages: uniqueImgs,
  updated,
  multiFormChars: formsWithUnique,
  failed,
  failureSample: failures.slice(0, 20),
});
