/**
 * Enrichit shinobi-all.json : formes manquantes, persos majeurs absents, gen Guerre (III).
 * Conserve les ids existants (zones/gyms).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'js/data/shinobi-all.json');
const ANILIST = '/tmp/anilist-naruto-chars.json';

const TYPE_SETS = {
  futon_yang: ['futon', 'yang'],
  raiton_yin: ['raiton', 'yin'],
  medical: ['medical', 'yang'],
  tai: ['taijutsu'],
  katon: ['katon'],
  suiton: ['suiton'],
  doton: ['doton'],
  futon: ['futon'],
  raiton: ['raiton'],
  yin: ['yin'],
  yang: ['yang'],
  gen: ['genjutsu', 'yin'],
  kekkei: ['kekkei'],
  katon_yin: ['katon', 'yin'],
  suiton_yin: ['suiton', 'yin'],
  raiton_taijutsu: ['raiton', 'taijutsu'],
  medical_yin: ['medical', 'yin'],
  kekkei_yang: ['kekkei', 'yang'],
  futon_raiton: ['futon', 'raiton'],
  katon_doton: ['katon', 'doton'],
};

function scaleStats(base, mult) {
  const out = {};
  for (const k of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
    out[k] = Math.max(30, Math.round((base[k] || 60) * mult));
  }
  return out;
}

function auraFor(formId, fallback = '#ea580c') {
  const map = {
    enfant: '#fb923c',
    academy: '#38bdf8',
    genin: '#f97316',
    chunin: '#fb7185',
    jonin: '#f59e0b',
    anbu: '#64748b',
    ship: '#ea580c',
    ado: '#f97316',
    adult: '#c2410c',
    hokage: '#fbbf24',
    kazekage: '#eab308',
    ermite: '#86efac',
    bijuu: '#dc2626',
    kyuubi1: '#ef4444',
    kyuubi2: '#f97316',
    baryon: '#fef08a',
    ashura: '#fde68a',
    ms: '#7f1d1d',
    ems: '#991b1b',
    rinnegan: '#6d28d9',
    mark: '#a855f7',
    hebi: '#334155',
    byakugou: '#fb7185',
    gates5: '#22c55e',
    gates8: '#ef4444',
    edo: '#94a3b8',
    susanoo: '#3b82f6',
    sage: '#4ade80',
    sixpaths: '#e2e8f0',
    tobi: '#1e293b',
    jinchuriki: '#b91c1c',
    v2: '#dc2626',
    full: '#7f1d1d',
    karma: '#6366f1',
    otsutsuki: '#c084fc',
    war: '#f43f5e',
    akatsuki: '#7f1d1d',
    kage: '#fbbf24',
    base: '#ea580c',
  };
  return map[formId] || fallback;
}

/** Lignes de formes pour persos majeurs (baseName exact dans le JSON). */
const FORM_LINES = {
  'Jiraiya': [
    { formId: 'jonin', formLabel: 'Jônin', gen: 1, mult: 1.0, types: TYPE_SETS.katon },
    { formId: 'ermite', formLabel: 'Mode Ermite', gen: 2, mult: 1.35, types: TYPE_SETS.kekkei_yang },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.45, types: TYPE_SETS.katon },
  ],
  'Jiraya': [
    { formId: 'jonin', formLabel: 'Jônin', gen: 1, mult: 1.0, types: TYPE_SETS.katon },
    { formId: 'ermite', formLabel: 'Mode Ermite', gen: 2, mult: 1.35, types: TYPE_SETS.kekkei_yang },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.45, types: TYPE_SETS.katon },
  ],
  'Chouji Akimichi': [
    { formId: 'enfant', formLabel: 'Enfant', gen: 1, mult: 0.85, types: TYPE_SETS.yang },
    { formId: 'ship', formLabel: 'Shippuden', gen: 2, mult: 1.15, types: TYPE_SETS.yang },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.35, types: TYPE_SETS.yang },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.4, types: TYPE_SETS.yang },
  ],
  'Chôji Akimichi': [
    { formId: 'enfant', formLabel: 'Enfant', gen: 1, mult: 0.85, types: TYPE_SETS.yang },
    { formId: 'ship', formLabel: 'Shippuden', gen: 2, mult: 1.15, types: TYPE_SETS.yang },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.35, types: TYPE_SETS.yang },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.4, types: TYPE_SETS.yang },
  ],
  'Kankuro': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.9, types: TYPE_SETS.doton },
    { formId: 'jonin', formLabel: 'Jônin', gen: 2, mult: 1.2, types: TYPE_SETS.doton },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.35, types: TYPE_SETS.doton },
  ],
  'Kankurô': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.9, types: TYPE_SETS.doton },
    { formId: 'jonin', formLabel: 'Jônin', gen: 2, mult: 1.2, types: TYPE_SETS.doton },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.35, types: TYPE_SETS.doton },
  ],
  'Oonoki': [
    { formId: 'tsuchikage', formLabel: '3e Tsuchikage', gen: 2, mult: 1.2, types: TYPE_SETS.doton },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: TYPE_SETS.kekkei },
  ],
  'Ônoki': [
    { formId: 'tsuchikage', formLabel: '3e Tsuchikage', gen: 2, mult: 1.2, types: TYPE_SETS.doton },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: TYPE_SETS.kekkei },
  ],
  'Juugo': [
    { formId: 'base', formLabel: 'Base', gen: 2, mult: 1.0, types: TYPE_SETS.yang },
    { formId: 'sage', formLabel: 'Marque maudite', gen: 2, mult: 1.3, types: TYPE_SETS.kekkei_yang },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: TYPE_SETS.kekkei_yang },
  ],
  'Jûgo': [
    { formId: 'base', formLabel: 'Base', gen: 2, mult: 1.0, types: TYPE_SETS.yang },
    { formId: 'sage', formLabel: 'Marque maudite', gen: 2, mult: 1.3, types: TYPE_SETS.kekkei_yang },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: TYPE_SETS.kekkei_yang },
  ],
  'Tobi': [
    { formId: 'tobi', formLabel: 'Tobi / Masque', gen: 2, mult: 1.1, types: TYPE_SETS.katon_yin },
    { formId: 'obito', formLabel: 'Obito révélé', gen: 2, mult: 1.35, types: TYPE_SETS.katon_yin },
    { formId: 'jinchuriki', formLabel: 'Jinchûriki du Jûbi', gen: 3, mult: 1.7, types: TYPE_SETS.kekkei },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.5, types: TYPE_SETS.katon_yin },
  ],
  'Pain': [
    { formId: 'deva', formLabel: 'Voie Deva', gen: 2, mult: 1.25, types: TYPE_SETS.raiton_yin },
    { formId: 'six', formLabel: 'Six Chemins', gen: 2, mult: 1.55, types: TYPE_SETS.kekkei },
  ],
  'Yahiko': [
    { formId: 'enfant', formLabel: 'Enfant', gen: 1, mult: 0.8, types: TYPE_SETS.yang },
    { formId: 'akatsuki', formLabel: 'Akatsuki originelle', gen: 2, mult: 1.15, types: TYPE_SETS.yang },
  ],
  'Guy Might': [
    { formId: 'jonin', formLabel: 'Jônin', gen: 1, mult: 1.0, types: TYPE_SETS.tai },
    { formId: 'gates5', formLabel: '5 Portes', gen: 2, mult: 1.35, types: TYPE_SETS.tai },
    { formId: 'gates8', formLabel: '8 Portes — Soirée', gen: 3, mult: 1.85, types: TYPE_SETS.tai },
  ],
  'Hinata Hyûga': [
    { formId: 'enfant', formLabel: 'Enfant', gen: 1, mult: 0.85, types: ['taijutsu', 'kekkei'] },
    { formId: 'ship', formLabel: 'Shippuden', gen: 2, mult: 1.15, types: ['taijutsu', 'kekkei'] },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: ['taijutsu', 'kekkei'] },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.35, types: ['taijutsu', 'kekkei'] },
  ],
  'Neji Hyûga': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.95, types: ['taijutsu', 'kekkei'] },
    { formId: 'jonin', formLabel: 'Jônin', gen: 2, mult: 1.25, types: ['taijutsu', 'kekkei'] },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: ['taijutsu', 'kekkei'] },
  ],
  'Shikamaru Nara': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.9, types: TYPE_SETS.yin },
    { formId: 'jonin', formLabel: 'Jônin', gen: 2, mult: 1.2, types: TYPE_SETS.yin },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.35, types: TYPE_SETS.yin },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.4, types: TYPE_SETS.yin },
  ],
  'Ino Yamanaka': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.9, types: TYPE_SETS.gen },
    { formId: 'ship', formLabel: 'Shippuden', gen: 2, mult: 1.15, types: TYPE_SETS.gen },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.3, types: TYPE_SETS.gen },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.35, types: TYPE_SETS.gen },
  ],
  'Kiba Inuzuka': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.9, types: TYPE_SETS.tai },
    { formId: 'ship', formLabel: 'Shippuden', gen: 2, mult: 1.15, types: TYPE_SETS.tai },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.3, types: TYPE_SETS.tai },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.35, types: TYPE_SETS.tai },
  ],
  'Shino Aburame': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.9, types: TYPE_SETS.yin },
    { formId: 'jonin', formLabel: 'Jônin', gen: 2, mult: 1.2, types: TYPE_SETS.yin },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.35, types: TYPE_SETS.yin },
  ],
  'Tenten': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.9, types: TYPE_SETS.yang },
    { formId: 'ship', formLabel: 'Shippuden', gen: 2, mult: 1.15, types: TYPE_SETS.yang },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.3, types: TYPE_SETS.yang },
  ],
  'Temari': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.95, types: TYPE_SETS.futon },
    { formId: 'jonin', formLabel: 'Jônin', gen: 2, mult: 1.25, types: TYPE_SETS.futon },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.4, types: TYPE_SETS.futon },
  ],
  'Tsunade Senju': [
    { formId: 'sannin', formLabel: 'Sannin', gen: 1, mult: 1.15, types: TYPE_SETS.medical },
    { formId: 'hokage', formLabel: '5e Hokage', gen: 2, mult: 1.4, types: TYPE_SETS.medical },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.5, types: TYPE_SETS.medical },
  ],
  'Orochimaru': [
    { formId: 'sannin', formLabel: 'Sannin', gen: 1, mult: 1.2, types: TYPE_SETS.kekkei },
    { formId: 'otogakure', formLabel: 'Otokage', gen: 1, mult: 1.35, types: TYPE_SETS.kekkei },
    { formId: 'war', formLabel: 'Guerre (allié)', gen: 3, mult: 1.45, types: TYPE_SETS.kekkei },
  ],
  'Kabuto Yakushi': [
    { formId: 'spy', formLabel: 'Espion', gen: 1, mult: 1.0, types: TYPE_SETS.medical_yin },
    { formId: 'snake', formLabel: 'Mode Ermite serpent', gen: 2, mult: 1.4, types: TYPE_SETS.kekkei },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.55, types: TYPE_SETS.kekkei },
  ],
  'Kisame Hoshigaki': [
    { formId: 'anbu', formLabel: 'Anbu Kiri', gen: 1, mult: 1.05, types: TYPE_SETS.suiton },
    { formId: 'akatsuki', formLabel: 'Akatsuki', gen: 2, mult: 1.35, types: TYPE_SETS.suiton },
    { formId: 'samehada', formLabel: 'Fusion Samehada', gen: 2, mult: 1.55, types: TYPE_SETS.suiton_yin },
  ],
  'Konan': [
    { formId: 'akatsuki', formLabel: 'Akatsuki', gen: 2, mult: 1.2, types: TYPE_SETS.futon },
    { formId: 'angel', formLabel: 'Ange de Dieu', gen: 2, mult: 1.45, types: TYPE_SETS.kekkei },
  ],
  'Sasori': [
    { formId: 'akatsuki', formLabel: 'Akatsuki', gen: 2, mult: 1.25, types: TYPE_SETS.doton },
    { formId: 'hiruko', formLabel: 'Hiruko', gen: 2, mult: 1.4, types: TYPE_SETS.kekkei },
    { formId: 'true', formLabel: 'Corps marionnette', gen: 2, mult: 1.5, types: TYPE_SETS.kekkei },
  ],
  'Hidan': [
    { formId: 'akatsuki', formLabel: 'Akatsuki', gen: 2, mult: 1.2, types: TYPE_SETS.yin },
    { formId: 'ritual', formLabel: 'Rituel Jashin', gen: 2, mult: 1.4, types: TYPE_SETS.kekkei },
  ],
  'Kakuzu': [
    { formId: 'akatsuki', formLabel: 'Akatsuki', gen: 2, mult: 1.25, types: TYPE_SETS.doton },
    { formId: 'masks', formLabel: 'Cinq cœurs', gen: 2, mult: 1.5, types: TYPE_SETS.kekkei },
  ],
  'Deidara': [
    { formId: 'akatsuki', formLabel: 'Akatsuki', gen: 2, mult: 1.2, types: TYPE_SETS.doton },
    { formId: 'c4', formLabel: 'C4 Karura', gen: 2, mult: 1.45, types: TYPE_SETS.kekkei },
  ],
  'Zabuza Momochi': [
    { formId: 'demon', formLabel: 'Démon du brouillard', gen: 1, mult: 1.1, types: TYPE_SETS.suiton },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.35, types: TYPE_SETS.suiton },
  ],
  'Haku': [
    { formId: 'base', formLabel: 'Base', gen: 1, mult: 1.0, types: TYPE_SETS.suiton },
    { formId: 'mirrors', formLabel: 'Démons de glace', gen: 1, mult: 1.3, types: TYPE_SETS.kekkei },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.35, types: TYPE_SETS.kekkei },
  ],
  'Konohamaru Sarutobi': [
    { formId: 'enfant', formLabel: 'Enfant', gen: 1, mult: 0.75, types: TYPE_SETS.katon },
    { formId: 'genin', formLabel: 'Genin', gen: 4, mult: 1.1, types: TYPE_SETS.katon },
    { formId: 'jonin', formLabel: 'Jônin', gen: 4, mult: 1.35, types: TYPE_SETS.katon },
  ],
  'Asuma Sarutobi': [
    { formId: 'jonin', formLabel: 'Jônin', gen: 1, mult: 1.05, types: TYPE_SETS.futon },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.3, types: TYPE_SETS.futon },
  ],
  'Kurenai Yuuhi': [
    { formId: 'jonin', formLabel: 'Jônin', gen: 1, mult: 1.0, types: TYPE_SETS.gen },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.2, types: TYPE_SETS.gen },
  ],
  'Yamato': [
    { formId: 'anbu', formLabel: 'Anbu', gen: 2, mult: 1.1, types: TYPE_SETS.doton },
    { formId: 'mokuton', formLabel: 'Mokuton', gen: 2, mult: 1.35, types: TYPE_SETS.kekkei },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: TYPE_SETS.kekkei },
  ],
  'Sai': [
    { formId: 'anbu', formLabel: 'Racine', gen: 2, mult: 1.05, types: TYPE_SETS.yin },
    { formId: 'jonin', formLabel: 'Jônin', gen: 2, mult: 1.25, types: TYPE_SETS.yin },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.35, types: TYPE_SETS.yin },
  ],
  'Karin': [
    { formId: 'base', formLabel: 'Base', gen: 2, mult: 1.0, types: TYPE_SETS.medical },
    { formId: 'seal', formLabel: 'Marque maudite', gen: 2, mult: 1.25, types: TYPE_SETS.kekkei },
  ],
  'Suigetsu Houzuki': [
    { formId: 'base', formLabel: 'Base', gen: 2, mult: 1.0, types: TYPE_SETS.suiton },
    { formId: 'hydra', formLabel: 'Hydrification', gen: 2, mult: 1.25, types: TYPE_SETS.kekkei },
  ],
  'Kimimaro Kaguya': [
    { formId: 'base', formLabel: 'Base', gen: 1, mult: 1.1, types: TYPE_SETS.kekkei },
    { formId: 'mark', formLabel: 'Marque maudite', gen: 1, mult: 1.35, types: TYPE_SETS.kekkei },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.4, types: TYPE_SETS.kekkei },
  ],
  'Danzô Shimura': [
    { formId: 'root', formLabel: 'Racine', gen: 2, mult: 1.2, types: TYPE_SETS.yin },
    { formId: 'sharingan', formLabel: 'Bras Sharingan', gen: 2, mult: 1.45, types: TYPE_SETS.kekkei },
  ],
  'Danzou Shimura': [
    { formId: 'root', formLabel: 'Racine', gen: 2, mult: 1.2, types: TYPE_SETS.yin },
    { formId: 'sharingan', formLabel: 'Bras Sharingan', gen: 2, mult: 1.45, types: TYPE_SETS.kekkei },
  ],
  'Shisui Uchiha': [
    { formId: 'anbu', formLabel: 'Anbu', gen: 1, mult: 1.15, types: TYPE_SETS.katon_yin },
    { formId: 'ms', formLabel: 'Sharingan hypnotique', gen: 1, mult: 1.45, types: TYPE_SETS.gen },
  ],
  'Hiruzen Sarutobi': [
    { formId: 'hokage', formLabel: '3e Hokage', gen: 1, mult: 1.25, types: TYPE_SETS.katon },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.4, types: TYPE_SETS.katon },
  ],
  'Tobirama Senju': [
    { formId: 'hokage', formLabel: '2e Hokage', gen: 1, mult: 1.3, types: TYPE_SETS.suiton },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.45, types: TYPE_SETS.suiton },
  ],
  'Mei Terumî': [
    { formId: 'mizukage', formLabel: '5e Mizukage', gen: 2, mult: 1.25, types: TYPE_SETS.suiton },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: TYPE_SETS.kekkei },
  ],
  'Mei Terumi': [
    { formId: 'mizukage', formLabel: '5e Mizukage', gen: 2, mult: 1.25, types: TYPE_SETS.suiton },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.4, types: TYPE_SETS.kekkei },
  ],
  'A (Raikage)': [
    { formId: 'raikage', formLabel: '4e Raikage', gen: 2, mult: 1.3, types: TYPE_SETS.raiton_taijutsu },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.45, types: TYPE_SETS.raiton_taijutsu },
  ],
  'Anko Mitarashi': [
    { formId: 'jonin', formLabel: 'Jônin', gen: 1, mult: 1.0, types: TYPE_SETS.katon },
    { formId: 'mark', formLabel: 'Marque maudite', gen: 1, mult: 1.25, types: TYPE_SETS.kekkei },
  ],
  'Shizune': [
    { formId: 'jonin', formLabel: 'Médicale', gen: 1, mult: 1.0, types: TYPE_SETS.medical },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.2, types: TYPE_SETS.medical },
  ],
  'Hashirama Senju': [
    { formId: 'hokage', formLabel: '1er Hokage', gen: 1, mult: 1.4, types: TYPE_SETS.kekkei },
    { formId: 'sage', formLabel: 'Mode Ermite', gen: 1, mult: 1.6, types: TYPE_SETS.kekkei_yang },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.55, types: TYPE_SETS.kekkei },
  ],
  'Kushina Uzumaki': [
    { formId: 'jinchuriki', formLabel: 'Jinchûriki', gen: 1, mult: 1.2, types: TYPE_SETS.futon_yang },
    { formId: 'adamantine', formLabel: 'Chaînes Adamantine', gen: 1, mult: 1.4, types: TYPE_SETS.kekkei },
  ],
  'Hagoromo Ootsutsuki': [
    { formId: 'sage', formLabel: 'Ermite des Six Chemins', gen: 3, mult: 1.8, types: TYPE_SETS.kekkei },
    { formId: 'spirit', formLabel: 'Esprit', gen: 3, mult: 1.6, types: TYPE_SETS.yin },
  ],
  'Kaguya Ootsutsuki': [
    { formId: 'rabbit', formLabel: 'Déesse Lapin', gen: 3, mult: 1.9, types: TYPE_SETS.kekkei },
    { formId: 'ash', formLabel: 'Os cendrés', gen: 3, mult: 2.0, types: TYPE_SETS.kekkei },
  ],
  'Momoshiki Ootsutsuki': [
    { formId: 'base', formLabel: 'Base', gen: 4, mult: 1.4, types: TYPE_SETS.kekkei },
    { formId: 'fused', formLabel: 'Fusion Kinshiki', gen: 4, mult: 1.7, types: TYPE_SETS.kekkei },
  ],
  'Kawaki': [
    { formId: 'karma', formLabel: 'Karma', gen: 4, mult: 1.2, types: TYPE_SETS.yang },
    { formId: 'vessel', formLabel: 'Réceptacle Isshiki', gen: 4, mult: 1.55, types: TYPE_SETS.kekkei },
    { formId: 'adult', formLabel: 'Futur', gen: 4, mult: 1.65, types: TYPE_SETS.kekkei },
  ],
  'Sarada Uchiha': [
    { formId: 'genin', formLabel: 'Genin', gen: 4, mult: 1.0, types: TYPE_SETS.katon_yin },
    { formId: 'ms', formLabel: 'Sharingan', gen: 4, mult: 1.3, types: TYPE_SETS.katon_yin },
  ],
  'Mitsuki': [
    { formId: 'genin', formLabel: 'Genin', gen: 4, mult: 1.0, types: TYPE_SETS.suiton },
    { formId: 'sage', formLabel: 'Mode Ermite', gen: 4, mult: 1.35, types: TYPE_SETS.kekkei },
  ],
  'Code': [
    { formId: 'base', formLabel: 'Base', gen: 4, mult: 1.35, types: TYPE_SETS.kekkei },
    { formId: 'limit', formLabel: 'Limiteur retiré', gen: 4, mult: 1.7, types: TYPE_SETS.kekkei },
  ],
  'Jigen': [
    { formId: 'vessel', formLabel: 'Réceptacle', gen: 4, mult: 1.4, types: TYPE_SETS.kekkei },
    { formId: 'isshiki', formLabel: 'Isshiki Ôtsutsuki', gen: 4, mult: 1.85, types: TYPE_SETS.kekkei },
  ],
  'Delta': [
    { formId: 'base', formLabel: 'Base', gen: 4, mult: 1.25, types: TYPE_SETS.raiton },
    { formId: 'full', formLabel: 'Pleine puissance', gen: 4, mult: 1.45, types: TYPE_SETS.raiton },
  ],
  'Boro': [
    { formId: 'base', formLabel: 'Base', gen: 4, mult: 1.3, types: TYPE_SETS.yang },
    { formId: 'core', formLabel: 'Noyau exposé', gen: 4, mult: 1.5, types: TYPE_SETS.kekkei },
  ],
  'Gaara': [
    { formId: 'enfant', formLabel: 'Conteneur de Shukaku', gen: 1, mult: 1.0, types: TYPE_SETS.doton },
    { formId: 'kazekage', formLabel: 'Kazekage', gen: 2, mult: 1.3, types: TYPE_SETS.doton },
    { formId: 'war', formLabel: 'Guerre', gen: 3, mult: 1.45, types: TYPE_SETS.doton },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.4, types: TYPE_SETS.doton },
  ],
  'Itachi Uchiha': [
    { formId: 'anbu', formLabel: 'Anbu', gen: 1, mult: 1.15, types: TYPE_SETS.katon_yin },
    { formId: 'akatsuki', formLabel: 'Akatsuki', gen: 2, mult: 1.4, types: TYPE_SETS.gen },
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.5, types: TYPE_SETS.gen },
  ],
  'Rock Lee': [
    { formId: 'genin', formLabel: 'Genin', gen: 1, mult: 0.95, types: TYPE_SETS.tai },
    { formId: 'gates5', formLabel: '5 Portes', gen: 1, mult: 1.3, types: TYPE_SETS.tai },
    { formId: 'gates8', formLabel: '8 Portes', gen: 2, mult: 1.6, types: TYPE_SETS.tai },
    { formId: 'adult', formLabel: 'Adulte', gen: 4, mult: 1.4, types: TYPE_SETS.tai },
  ],
  'Killer Bee': [
    { formId: 'jinchuriki', formLabel: 'Jinchûriki', gen: 2, mult: 1.2, types: TYPE_SETS.raiton },
    { formId: 'v2', formLabel: 'Version 2', gen: 2, mult: 1.4, types: TYPE_SETS.raiton },
    { formId: 'full', formLabel: 'Gyûki Complet', gen: 3, mult: 1.65, types: TYPE_SETS.kekkei },
  ],
  'Madara Uchiha': [
    { formId: 'edo', formLabel: 'Edo Tensei', gen: 3, mult: 1.5, types: TYPE_SETS.katon_yin },
    { formId: 'rinnegan', formLabel: 'Rinnegan', gen: 3, mult: 1.7, types: TYPE_SETS.kekkei },
    { formId: 'jubii', formLabel: 'Jinchûriki du Jûbi', gen: 3, mult: 1.95, types: TYPE_SETS.kekkei },
  ],
  'Minato Namikaze': [
    { formId: 'jonin', formLabel: 'Jônin', gen: 1, mult: 1.15, types: TYPE_SETS.futon_raiton },
    { formId: 'hokage', formLabel: '4e Hokage', gen: 1, mult: 1.4, types: TYPE_SETS.futon_raiton },
    { formId: 'kyuubi', formLabel: 'Mode Chakra Kyûbi', gen: 3, mult: 1.6, types: TYPE_SETS.futon_yang },
  ],
  'Kakashi Hatake': [
    { formId: 'anbu', formLabel: 'Anbu', gen: 1, mult: 1.05, types: TYPE_SETS.raiton },
    { formId: 'jonin', formLabel: 'Jônin', gen: 1, mult: 1.2, types: TYPE_SETS.raiton },
    { formId: 'ms', formLabel: 'Sharingan', gen: 2, mult: 1.4, types: TYPE_SETS.raiton_yin },
    { formId: 'dharmac', formLabel: 'Double Mangekyô', gen: 3, mult: 1.55, types: TYPE_SETS.raiton_yin },
    { formId: 'hokage', formLabel: '6e Hokage', gen: 4, mult: 1.45, types: TYPE_SETS.raiton },
  ],
};

/** Alias AniList → baseName FR + village + role */
const NEW_CHARS = [
  { anilistId: 2423, baseName: 'Jiraiya', village: 'konoha', role: 'MAIN', types: TYPE_SETS.katon, gen: 1 },
  { anilistId: 2008, baseName: 'Chouji Akimichi', village: 'konoha', role: 'SUPPORTING', types: TYPE_SETS.yang, gen: 1 },
  { anilistId: 4694, baseName: 'Kankuro', village: 'suna', role: 'SUPPORTING', types: TYPE_SETS.doton, gen: 1 },
  { anilistId: 23475, baseName: 'Oonoki', village: 'iwa', role: 'SUPPORTING', types: TYPE_SETS.doton, gen: 2 },
  { anilistId: 3152, baseName: 'Juugo', village: 'otogakure', role: 'SUPPORTING', types: TYPE_SETS.yang, gen: 2 },
  { anilistId: 3149, baseName: 'Tobi', village: 'ame', role: 'MAIN', types: TYPE_SETS.katon_yin, gen: 2 },
  { anilistId: 23050, baseName: 'Yahiko', village: 'ame', role: 'SUPPORTING', types: TYPE_SETS.yang, gen: 1 },
  { anilistId: 3179, baseName: 'Konan', village: 'ame', role: 'SUPPORTING', types: TYPE_SETS.futon, gen: 2 },
  { anilistId: 1900, baseName: 'Sasori', village: 'suna', role: 'SUPPORTING', types: TYPE_SETS.doton, gen: 2 },
  { anilistId: 2792, baseName: 'Hidan', village: 'ame', role: 'SUPPORTING', types: TYPE_SETS.yin, gen: 2 },
  { anilistId: 3178, baseName: 'Kakuzu', village: 'taki', role: 'SUPPORTING', types: TYPE_SETS.doton, gen: 2 },
  { anilistId: 809, baseName: 'Anko Mitarashi', village: 'konoha', role: 'SUPPORTING', types: TYPE_SETS.katon, gen: 1 },
  { anilistId: 57883, baseName: 'Hagoromo Ootsutsuki', village: 'alliance', role: 'MAIN', types: TYPE_SETS.kekkei, gen: 3 },
  { anilistId: 126069, baseName: 'Kaguya Ootsutsuki', village: 'alliance', role: 'MAIN', types: TYPE_SETS.kekkei, gen: 3 },
  { anilistId: 127027, baseName: 'Momoshiki Ootsutsuki', village: 'kara', role: 'MAIN', types: TYPE_SETS.kekkei, gen: 4 },
  { anilistId: 127028, baseName: 'Kinshiki Ootsutsuki', village: 'kara', role: 'SUPPORTING', types: TYPE_SETS.kekkei, gen: 4 },
  { anilistId: 127029, baseName: 'Urashiki Ootsutsuki', village: 'kara', role: 'SUPPORTING', types: TYPE_SETS.kekkei, gen: 4 },
  { anilistId: 127030, baseName: 'Toneri Ootsutsuki', village: 'kara', role: 'SUPPORTING', types: TYPE_SETS.kekkei, gen: 4 },
  { anilistId: 165868, baseName: 'Hamura Ootsutsuki', village: 'alliance', role: 'SUPPORTING', types: TYPE_SETS.kekkei, gen: 3 },
  { anilistId: 197843, baseName: 'Indra Ootsutsuki', village: 'alliance', role: 'SUPPORTING', types: TYPE_SETS.yin, gen: 3 },
  { anilistId: 269851, baseName: 'Ashura Ootsutsuki', village: 'alliance', role: 'SUPPORTING', types: TYPE_SETS.yang, gen: 3 },
  { anilistId: 130418, baseName: 'Jigen', village: 'kara', role: 'MAIN', types: TYPE_SETS.kekkei, gen: 4 },
  { anilistId: 189949, baseName: 'Code', village: 'kara', role: 'MAIN', types: TYPE_SETS.kekkei, gen: 4 },
  { anilistId: 130415, baseName: 'Delta', village: 'kara', role: 'SUPPORTING', types: TYPE_SETS.raiton, gen: 4 },
  { anilistId: 180513, baseName: 'Boro', village: 'kara', role: 'SUPPORTING', types: TYPE_SETS.yang, gen: 4 },
  { anilistId: 130417, baseName: 'Amado', village: 'kara', role: 'SUPPORTING', types: TYPE_SETS.medical, gen: 4 },
  { anilistId: 220447, baseName: 'Eida', village: 'kara', role: 'SUPPORTING', types: TYPE_SETS.gen, gen: 4 },
  { anilistId: 271653, baseName: 'Daemon', village: 'kara', role: 'SUPPORTING', types: TYPE_SETS.tai, gen: 4 },
  { anilistId: 23418, baseName: 'Chojuro', village: 'kiri', role: 'SUPPORTING', types: TYPE_SETS.suiton, gen: 2 },
  { anilistId: 23476, baseName: 'Darui', village: 'kumo', role: 'SUPPORTING', types: TYPE_SETS.raiton, gen: 2 },
  { anilistId: 23474, baseName: 'Kurotsuchi', village: 'iwa', role: 'SUPPORTING', types: TYPE_SETS.doton, gen: 4 },
  { anilistId: 121442, baseName: 'Shikadai Nara', village: 'konoha', role: 'SUPPORTING', types: TYPE_SETS.yin, gen: 4 },
  { anilistId: 121441, baseName: 'Inojin Yamanaka', village: 'konoha', role: 'SUPPORTING', types: TYPE_SETS.gen, gen: 4 },
  { anilistId: 121445, baseName: 'Himawari Uzumaki', village: 'konoha', role: 'SUPPORTING', types: ['taijutsu', 'kekkei'], gen: 4 },
];

function baseStatsFromRole(role, gen) {
  const tier = role === 'MAIN' ? 1.15 : role === 'SUPPORTING' ? 1.0 : 0.85;
  const g = 1 + (gen - 1) * 0.08;
  return {
    hp: Math.round(70 * tier * g),
    atk: Math.round(72 * tier * g),
    def: Math.round(65 * tier * g),
    spa: Math.round(70 * tier * g),
    spd: Math.round(66 * tier * g),
    spe: Math.round(68 * tier * g),
  };
}

function makeEntry(id, opts) {
  const {
    baseName,
    formId,
    formLabel,
    types,
    stats,
    generation,
    village,
    role,
    image,
    anilistId,
    evolvesTo = null,
    aura,
  } = opts;
  const captureRate = Math.max(8, Math.round(55 - generation * 4 - (role === 'MAIN' ? 8 : 0)));
  const baseExp = Math.round(140 + generation * 20 + (stats.hp + stats.atk) / 4);
  return {
    id,
    name: `${baseName} (${formId})`,
    nameFr: `${baseName} — ${formLabel}`,
    baseName,
    formId,
    formLabel,
    aura: aura || auraFor(formId),
    types,
    ...stats,
    baseExp,
    captureRate,
    generation,
    village: village || 'konoha',
    role: role || 'SUPPORTING',
    image,
    anilistId,
    evolvesTo,
  };
}

function renameBase(name) {
  // Normalize Hyuuga/Hyûga etc already in data
  return name;
}

const data = JSON.parse(readFileSync(SRC, 'utf8'));
const anilist = JSON.parse(readFileSync(ANILIST, 'utf8'));
const byAnilist = new Map(anilist.map((c) => [c.id, c]));
const byBase = new Map();
for (const s of data) {
  if (!byBase.has(s.baseName)) byBase.set(s.baseName, []);
  byBase.get(s.baseName).push(s);
}

let nextId = Math.max(...data.map((s) => s.id)) + 1;
const additions = [];
const existingAnilist = new Set(data.map((s) => s.anilistId).filter(Boolean));

// 1) Add missing characters (first form only; lines expanded below)
for (const nc of NEW_CHARS) {
  if (existingAnilist.has(nc.anilistId)) continue;
  const al = byAnilist.get(nc.anilistId);
  if (!al?.image) {
    console.warn('skip missing image', nc.baseName, nc.anilistId);
    continue;
  }
  // skip if baseName already present under different anilist
  if (byBase.has(nc.baseName)) continue;
  const stats = baseStatsFromRole(nc.role, nc.gen);
  const entry = makeEntry(nextId++, {
    baseName: nc.baseName,
    formId: 'base',
    formLabel: 'Base',
    types: nc.types,
    stats,
    generation: nc.gen,
    village: nc.village,
    role: nc.role,
    image: al.image,
    anilistId: nc.anilistId,
  });
  additions.push(entry);
  byBase.set(nc.baseName, [entry]);
  existingAnilist.add(nc.anilistId);
  console.log('ADD', nc.baseName, entry.id);
}

// Also add any MAIN/SUPPORTING from AniList not yet present
for (const al of anilist) {
  if (existingAnilist.has(al.id)) continue;
  if (al.role === 'BACKGROUND') continue;
  // skip "no Haha/Chichi" junk already handled poorly
  if (/\bno (Haha|Chichi)\b/i.test(al.name)) continue;
  if (/no Haha|no Chichi/.test(al.name)) continue;
  const baseName = al.name;
  if (byBase.has(baseName)) continue;
  const gen = al.media === 97938 || al.media === 107123 ? 4 : al.media === 1735 ? 2 : 1;
  const village = 'konoha';
  const stats = baseStatsFromRole(al.role, gen);
  const types =
    al.role === 'MAIN' ? TYPE_SETS.yang : TYPE_SETS.tai;
  const entry = makeEntry(nextId++, {
    baseName,
    formId: 'base',
    formLabel: 'Base',
    types,
    stats,
    generation: gen,
    village,
    role: al.role,
    image: al.image,
    anilistId: al.id,
  });
  additions.push(entry);
  byBase.set(baseName, [entry]);
  existingAnilist.add(al.id);
}

const all = [...data, ...additions];
// refresh byBase
byBase.clear();
for (const s of all) {
  if (!byBase.has(s.baseName)) byBase.set(s.baseName, []);
  byBase.get(s.baseName).push(s);
}

// 2) Expand form lines for majors that only have 1 form OR replace weak lines
const formAdditions = [];
for (const [baseName, line] of Object.entries(FORM_LINES)) {
  const existing = byBase.get(baseName);
  if (!existing || !existing.length) continue;
  // If already has >= line.length forms with distinct formIds matching, skip
  const existingForms = new Set(existing.map((e) => e.formId));
  const need = line.filter((f) => !existingForms.has(f.formId));
  if (!need.length && existing.length >= line.length) {
    // still fix gens on war forms
    for (const e of existing) {
      const match = line.find((f) => f.formId === e.formId);
      if (match) e.generation = match.gen;
    }
    continue;
  }

  // Use first existing as template (image, anilist, village, role)
  const tpl = existing[0];
  const baseStats = {
    hp: tpl.hp,
    atk: tpl.atk,
    def: tpl.def,
    spa: tpl.spa,
    spd: tpl.spd,
    spe: tpl.spe,
  };

  // If only one "Base"/"base" form, retarget it to first line form
  if (existing.length === 1 && (tpl.formId === 'base' || tpl.formId === 'Base' || tpl.formLabel === 'Base')) {
    const first = line[0];
    Object.assign(tpl, {
      formId: first.formId,
      formLabel: first.formLabel,
      name: `${baseName} (${first.formId})`,
      nameFr: `${baseName} — ${first.formLabel}`,
      generation: first.gen,
      types: first.types,
      aura: auraFor(first.formId, tpl.aura),
      ...scaleStats(baseStats, first.mult),
    });
    // chain the rest
    let prev = tpl;
    for (let i = 1; i < line.length; i++) {
      const f = line[i];
      if (existingForms.has(f.formId)) continue;
      const stats = scaleStats(baseStats, f.mult);
      const entry = makeEntry(nextId++, {
        baseName,
        formId: f.formId,
        formLabel: f.formLabel,
        types: f.types,
        stats,
        generation: f.gen,
        village: tpl.village,
        role: tpl.role,
        image: tpl.image,
        anilistId: tpl.anilistId,
        aura: auraFor(f.formId, tpl.aura),
      });
      prev.evolvesTo = { to: entry.id, level: 10 + i * 8, trigger: 'level-up', item: null };
      prev = entry;
      formAdditions.push(entry);
    }
    prev.evolvesTo = null;
    continue;
  }

  // Append missing forms and wire from last existing
  let prev = existing[existing.length - 1];
  for (const f of need) {
    const stats = scaleStats(baseStats, f.mult);
    const entry = makeEntry(nextId++, {
      baseName,
      formId: f.formId,
      formLabel: f.formLabel,
      types: f.types,
      stats,
      generation: f.gen,
      village: tpl.village,
      role: tpl.role,
      image: tpl.image,
      anilistId: tpl.anilistId,
      aura: auraFor(f.formId, tpl.aura),
    });
    if (prev && !prev.evolvesTo) {
      prev.evolvesTo = { to: entry.id, level: Math.min(90, 12 + existing.length * 8), trigger: 'level-up', item: null };
    }
    prev = entry;
    formAdditions.push(entry);
  }
}

const final = [...all, ...formAdditions];

// 3) Assign gen 3 to war-ish form labels still on gen 2
for (const s of final) {
  if (
    s.generation === 2 &&
    /war|edo|jubii|jinchuriki|gates8|sixpaths|ashura|baryon|dharmac|bijuu|kyuubi/i.test(
      `${s.formId} ${s.formLabel}`,
    )
  ) {
    // keep Madara etc as gen 3
    if (/edo|jubii|war|gates8|jûbi|jubii/i.test(`${s.formId} ${s.formLabel}`)) {
      s.generation = 3;
    }
  }
}

// Fix broken types arrays
for (const s of final) {
  if (!Array.isArray(s.types) || !s.types.length) s.types = ['yang'];
  s.types = s.types.filter((t) => typeof t === 'string');
}

// Sort by id
final.sort((a, b) => a.id - b.id);

writeFileSync(SRC, JSON.stringify(final, null, 2));
const bases = new Set(final.map((s) => s.baseName));
const gens = [1, 2, 3, 4].map((g) => `${g}:${final.filter((s) => s.generation === g).length}`).join(' ');
console.log('DONE forms', final.length, 'chars', bases.size, 'gens', gens, 'added', additions.length + formAdditions.length);
