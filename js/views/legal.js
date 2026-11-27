// Pages légales PROVISOIRES.
// Ce sont des trames : elles listent ce que chaque document devra contenir,
// sans engager personne. Les textes définitifs sont à rédiger par un juriste
// une fois la société immatriculée et le modèle validé.

import { BRAND, RULES } from '../config.js';
import { esc } from '../format.js';
import { icon } from '../icons.js';
import { emptyState, note, pageHead } from '../ui/blocks.js';

const rate = Math.round(RULES.buybackRate * 100);
const laterRate = Math.round(RULES.buybackLaterRate * 100);

const DOCS = {
  cgv: {
    title: 'Conditions générales de vente',
    sections: [
      ['Objet', "Vente en ligne de packs mystère contenant chacun une carte à collectionner physique, conservée par le vendeur jusqu'à sa livraison ou son rachat."],
      ['Produits et répartitions', 'Description des packs, paliers de cote et probabilités associées. Pour chaque carte : langue, version, état de l’exemplaire, authenticité ; le visuel est une image de référence, pas la photo de l’exemplaire.'],
      ['Prix', 'Prix en euros, toutes taxes comprises. Frais de livraison indiqués avant chaque achat.'],
      ['Commande et paiement', 'Création de compte, majorité vérifiée, récapitulatif avant validation, bouton indiquant l’obligation de payer, confirmation par e-mail avec les présentes conditions.'],
      ['Conservation au coffre', "Conditions de garde, assurance, durée, propriété de la carte."],
      ['Livraison', `Zones desservies, délais annoncés (${RULES.shipping.fr.delay} en France), frais affichés avant validation. La perte et la casse sont à la charge du vendeur jusqu'à la remise du colis.`],
      ['Rachat', `Rachat à ${rate} % de la cote de référence pendant ${RULES.buybackLockMinutes} minutes après l'ouverture, ${laterRate} % ensuite ; définition de cette cote. Nature du rachat à trancher (achat par le site ou avoir, pas les deux) : un solde retirable tenu par le vendeur relève d'un établissement agréé.`],
      ['Droit de rétractation', "Quatorze jours à compter de la réception de la carte ; tant qu'elle est au coffre, le délai n'a pas commencé. Aucune exception légale ne vise un bien tiré au sort : on ne peut pas y faire renoncer. Bouton de rétractation en ligne, formulaire type, remboursement sous quatorze jours. Compatibilité du modèle avec ce droit : à faire trancher par un avocat."],
      ['Garanties légales', 'Garantie légale de conformité (deux ans) et garantie des vices cachés, avec l’encadré légal reproduit tel quel. Carte unique : remplacement si un exemplaire identique existe, remboursement sinon.'],
      ['Réclamations et médiation', 'Service client, puis médiateur de la consommation désigné (nom, adresse, site), gratuit pour le client.'],
      ['Clôture du compte', 'Le solde déposé est reversé et les cartes sont livrées : une clôture ne confisque rien.'],
      ['Territoire', 'Offre limitée à la France : inscription, livraison et paiement.'],
    ],
  },
  cgu: {
    title: "Conditions d'utilisation",
    sections: [
      ['Accès au service', `Service réservé aux personnes de ${RULES.minAge} ans ou plus ; un seul compte par personne.`],
      ['Compte', "Exactitude des informations, sécurité des identifiants, suspension et clôture."],
      ['Comportements interdits', 'Fraude, multi-comptes, automatisation, détournement des giveaways et du classement.'],
      ['Bonus et cashback', `Conditions de mise d'un bonus (${RULES.bonus.wagering} fois son montant), ordre de dépense (l'argent du joueur d'abord), cas de clôture d'un bonus, calcul et versement du cashback.`],
      ['Giveaways et classement', 'Règlement des tirages au sort, financement et déblocage des lots, conditions de participation, calcul de la dotation.'],
      ['Jeu responsable', 'Limites de dépenses, pauses, auto-exclusion, ressources d’aide.'],
      ['Propriété intellectuelle', "Marques et visuels des cartes appartenant à leurs titulaires ; absence d'affiliation."],
      ['Responsabilité', 'Disponibilité du service, évolution des cotes, limites de responsabilité.'],
    ],
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    sections: [
      ['Responsable du traitement', 'Identité et coordonnées de la société, contact du délégué à la protection des données le cas échéant.'],
      ['Données collectées', 'Compte, commandes, adresse de livraison, pièces justificatives (KYC), données de navigation.'],
      ['Finalités et bases légales', 'Exécution du contrat, obligations légales, intérêt légitime (lutte contre la fraude), consentement.'],
      ['Destinataires et transferts', 'Prestataires de paiement, de vérification d’identité, de transport et d’hébergement ; hébergeur des images de cartes. Pays de destination et garanties pour tout transfert hors de l’Union européenne.'],
      ['Durées de conservation', 'Par catégorie de données.'],
      ['Tes droits', 'Accès, rectification, effacement, limitation, opposition, portabilité, retrait du consentement, directives après décès ; comment les exercer ; réclamation auprès de la CNIL.'],
      ['Décisions automatisées', 'Aucun blocage de compte ni refus de paiement sans intervention humaine.'],
      ['Stockage local et traceurs', 'Clés enregistrées dans le navigateur, strictement nécessaires au fonctionnement ; consentement recueilli avant toute mesure d’audience non exemptée.'],
    ],
    extra: "Cette démonstration n'a pas de serveur : ton compte, ton solde fictif et les adresses que tu saisis restent dans le stockage local de ton navigateur, en clair. Aucun cookie, aucune mesure d'audience, aucune publicité. Seules les images des cartes viennent d'un service tiers (images.pokemontcg.io), qui reçoit donc ton adresse IP.",
  },
  mentions: {
    title: 'Mentions légales',
    sections: [
      ['Éditeur', `${BRAND.company} — ${BRAND.address}. Forme sociale, capital, RCS (ville et numéro) et numéro de TVA à compléter.`],
      ['Directeur de la publication', 'À compléter.'],
      ['Hébergeur', 'Nom, adresse et téléphone de l’hébergeur à compléter.'],
      ['Contact', `${BRAND.email} ; téléphone à compléter.`],
      ['Médiateur de la consommation', 'Nom, adresse et site à compléter avant toute vente.'],
      ['Indépendance', `${BRAND.name} est un site indépendant. Il n'est ni édité, ni approuvé, ni parrainé par The Pokémon Company, Nintendo, Creatures Inc. ou GAME FREAK inc. Pokémon, les noms des Pokémon et des extensions sont des marques de leurs titulaires ; les illustrations des cartes leur appartiennent. Ils ne sont cités que pour désigner les cartes. Les packs sont composés par le site : ce ne sont ni des produits officiels ni des boosters scellés.`],
      ['Crédits', "Visuels et données de cartes : API Pokémon TCG (pokemontcg.io). Cotes : Cardmarket, via la même API. Icônes : Lucide (licence ISC). Polices : Unbounded et Manrope (licence OFL). Illustrations des packs et logo : images générées par IA, retouchées."],
    ],
  },
};

export default {
  title: (ctx) => DOCS[ctx.params.doc]?.title || 'Document introuvable',
  render({ params }) {
    const doc = DOCS[params.doc];
    if (!doc) return emptyState({ iconName: 'file-text', title: 'Document introuvable', action: '<a class="btn btn--primary" href="#/">Accueil</a>' });
    return `
    ${pageHead({ icon: 'file-text', title: doc.title })}
    <div class="narrow">
      ${note('<strong>Document provisoire.</strong> Cette page est une trame : elle indique ce que le document définitif devra couvrir. Elle n’a aucune valeur contractuelle et doit être rédigée par un juriste avant toute mise en vente.', 'warn')}
      ${doc.extra ? note(esc(doc.extra), 'demo') : ''}
      <section class="panel panel--pad prose">
        <ol class="legal">
          ${doc.sections.map(([title, text]) => `<li><h2>${esc(title)}</h2><p>${esc(text)}</p></li>`).join('')}
        </ol>
      </section>
      <nav class="legal-nav" aria-label="Autres documents">
        ${Object.entries(DOCS)
          .filter(([key]) => key !== params.doc)
          .map(([key, d]) => `<a class="btn btn--secondary btn--sm" href="#/legal/${key}">${icon('file-text', { size: 15 })}${esc(d.title)}</a>`)
          .join('')}
      </nav>
    </div>`;
  },
};
