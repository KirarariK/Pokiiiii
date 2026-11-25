// Liste des packs.

import { RULES } from '../config.js';
import { PACKS } from '../data/packs.js';
import { packTile, pageHead } from '../ui/blocks.js';
import { icon } from '../icons.js';

export default {
  nav: 'packs',
  title: 'Packs mystère',
  render() {
    return `
    ${pageHead({
      icon: 'package',
      title: 'Packs mystère',
      lead: `Un pack, une vraie carte. La probabilité de chaque carte et le retour théorique sont affichés sur la page du pack ; tu peux revendre ta carte à ${Math.round(RULES.buybackRate * 100)} % de sa cote dans les ${RULES.buybackLockMinutes} minutes.`,
    })}
    <div class="pack-grid pack-grid--wide">${PACKS.map(packTile).join('')}</div>
    <p class="muted small center">${icon('shield-check', { size: 14 })} État garanti : Near Mint minimum pour les séries récentes, Excellent pour les anciennes.</p>`;
  },
};
