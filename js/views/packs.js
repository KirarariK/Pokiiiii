// Liste des packs.

import { PACKS } from '../data/packs.js';
import { packTile, pageHead } from '../ui/blocks.js';
import { icon } from '../icons.js';

export default {
  nav: 'packs',
  title: 'Packs mystère',
  render() {
    return `
    ${pageHead({ icon: 'package', title: 'Packs mystère' })}
    <div class="pack-grid pack-grid--wide">${PACKS.map(packTile).join('')}</div>
    <p class="muted small center">${icon('shield-check', { size: 14 })} État garanti : Near Mint minimum pour les séries récentes, Excellent pour les anciennes.</p>`;
  },
};
