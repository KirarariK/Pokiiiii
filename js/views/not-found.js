// Page introuvable.

import { emptyState } from '../ui/blocks.js';

export default {
  title: 'Page introuvable',
  render() {
    return emptyState({
      iconName: 'search',
      title: 'Page introuvable',
      text: "Cette adresse ne mène nulle part. Le pack que tu cherches est peut-être par ici :",
      action: '<div class="empty__actions"><a class="btn btn--primary" href="#/packs">Voir les packs</a><a class="btn btn--secondary" href="#/">Accueil</a></div>',
    });
  },
};
