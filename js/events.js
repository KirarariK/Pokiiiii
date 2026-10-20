/** Événements journaliers rotatifs (hash du jour) */

import { todayKey } from './quests.js';

export const EVENT_DEFS = {
  shinyBoost: {
    id: 'shinyBoost',
    title: 'Chance chromatique',
    desc: 'Taux de chromatiques ×8 aujourd’hui',
    short: 'Chromatique ×8',
    shinyMult: 8,
    xpMult: 1,
    moneyMult: 1,
  },
  doubleXp: {
    id: 'doubleXp',
    title: 'Double expérience',
    desc: 'XP de combat ×2 aujourd’hui',
    short: 'XP ×2',
    shinyMult: 1,
    xpMult: 2,
    moneyMult: 1,
  },
  doubleMoney: {
    id: 'doubleMoney',
    title: 'Double argent',
    desc: 'Gains d’argent ×2 aujourd’hui',
    short: 'Argent ×2',
    shinyMult: 1,
    xpMult: 1,
    moneyMult: 2,
  },
};

const EVENT_ORDER = ['shinyBoost', 'doubleXp', 'doubleMoney'];

export function dayHash(day = todayKey()) {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getDailyEvent(ts = Date.now()) {
  const day = todayKey(ts);
  const idx = dayHash(day) % EVENT_ORDER.length;
  const id = EVENT_ORDER[idx];
  return { ...EVENT_DEFS[id], day };
}

export function eventMultipliers(ts = Date.now()) {
  const ev = getDailyEvent(ts);
  return {
    shiny: ev.shinyMult,
    xp: ev.xpMult,
    money: ev.moneyMult,
    event: ev,
  };
}

export function renderEventBanner(ts = Date.now()) {
  const ev = getDailyEvent(ts);
  return `
    <div class="event-banner" data-event="${ev.id}" title="${ev.desc}">
      <span class="event-banner-label">Événement</span>
      <strong>${ev.short}</strong>
    </div>`;
}
