// Suivi des demandes de livraison.

import { RULES } from '../config.js';
import { cardById } from '../catalog.js';
import { dateFr, esc, eur, plural } from '../format.js';
import { icon } from '../icons.js';
import { getState, ownedByUid } from '../store.js';
import { emptyState, pageHead } from '../ui/blocks.js';
import { cardImage } from '../ui/card.js';

const STEPS = ['Demande reçue', 'Préparation', 'Expédiée', 'Livrée'];
/** État de la demande -> libellé, icône, dernière étape atteinte. */
const STATUS = {
  preparation: { label: 'Préparation', icon: 'hourglass', step: 1 },
  expediee: { label: 'Expédiée', icon: 'truck', step: 2 },
  livree: { label: 'Livrée', icon: 'circle-check', step: 3 },
};

export default {
  nav: 'collection',
  title: 'Mes livraisons',
  auth: true,
  render() {
    const { shipments } = getState();
    const head = pageHead({ icon: 'truck', title: 'Mes livraisons' });
    if (!shipments.length) {
      return `${head}${emptyState({
        iconName: 'truck',
        title: 'Aucune livraison en cours',
        text: 'Depuis ta collection, sélectionne des cartes puis choisis « Faire livrer ».',
        action: '<a class="btn btn--primary" href="#/collection">Ma collection</a>',
      })}`;
    }
    return `
    ${head}
    <div class="stack">
      ${shipments
        .map((s) => {
          const cards = s.uids.map(ownedByUid).filter(Boolean).map((o) => cardById(o.cardId)).filter(Boolean);
          const zone = RULES.shipping[s.zone];
          const status = STATUS[s.status] || STATUS.preparation;
          return `<article class="panel panel--pad shipment">
            <header class="shipment__head">
              <div>
                <h2>Demande du ${dateFr(s.at)}</h2>
                <p class="muted small">${plural(cards.length, 'carte', 'cartes')} · ${esc(zone?.label || s.zone)} · frais ${eur(s.fee)} · délai annoncé ${esc(zone?.delay || '')}</p>
              </div>
              <span class="badge badge--info">${icon(status.icon, { size: 13 })}${status.label}</span>
            </header>
            <ol class="track" aria-label="Avancement">
              ${STEPS.map((label, i) => `<li class="track__step ${i <= status.step ? 'is-done' : ''}"><span class="track__dot"></span>${label}</li>`).join('')}
            </ol>
            <div class="shipment__cards">${cards.map((c) => cardImage(c)).join('')}</div>
            ${s.tracking ? `<p class="small">${icon('truck', { size: 14 })} Suivi : <strong>${esc(s.tracking)}</strong></p>` : ''}
            <p class="small muted">${icon('map-pin', { size: 14 })} ${esc(s.address.name)}, ${esc(s.address.line1)}${s.address.line2 ? `, ${esc(s.address.line2)}` : ''}, ${esc(s.address.zip)} ${esc(s.address.city)}</p>
          </article>`;
        })
        .join('')}
    </div>`;
  },
};
