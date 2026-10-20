/** Natures de chakra / spécialités — thème Naruto */
export const TYPE_COLORS = {
  katon: '#ef4444',
  suiton: '#3b82f6',
  doton: '#a16207',
  futon: '#86efac',
  raiton: '#facc15',
  yin: '#a855f7',
  yang: '#f97316',
  medical: '#fb7185',
  taijutsu: '#22c55e',
  genjutsu: '#c084fc',
  kekkei: '#e11d48',
};

export const TYPE_FR = {
  katon: 'Katon',
  suiton: 'Suiton',
  doton: 'Doton',
  futon: 'Fûton',
  raiton: 'Raiton',
  yin: 'Yin',
  yang: 'Yang',
  medical: 'Médical',
  taijutsu: 'Taijutsu',
  genjutsu: 'Genjutsu',
  kekkei: 'Kekkei Genkai',
};

/** Efficacité simplifiée (natures opposées). */
const CHART = {
  katon: { futon: 2, suiton: 0.5, katon: 0.5 },
  suiton: { katon: 2, doton: 0.5, suiton: 0.5 },
  doton: { suiton: 2, raiton: 0.5, doton: 0.5 },
  futon: { raiton: 2, katon: 0.5, futon: 0.5 },
  raiton: { doton: 2, futon: 0.5, raiton: 0.5 },
  yin: { yang: 2, yin: 0.5 },
  yang: { yin: 2, yang: 0.5 },
  medical: { taijutsu: 1.5 },
  taijutsu: { genjutsu: 1.5, medical: 0.75 },
  genjutsu: { taijutsu: 0.5, yin: 1.5 },
  kekkei: { katon: 1.25, suiton: 1.25, doton: 1.25, futon: 1.25, raiton: 1.25 },
};

export function typeEffectiveness(atkTypes, defTypes) {
  const atk = atkTypes || [];
  const def = defTypes || [];
  if (!atk.length || !def.length) return 1;
  let mult = 1;
  for (const a of atk) {
    const row = CHART[a] || {};
    for (const d of def) {
      if (row[d] != null) mult *= row[d];
    }
  }
  return mult;
}
