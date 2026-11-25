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
      ['Produits et répartitions', 'Description des packs, prix TTC, paliers de cote et probabilités associées, état garanti des cartes.'],
      ['Commande et paiement', 'Création de compte, majorité requise, moyens de paiement, moment où la vente est conclue.'],
      ['Conservation au coffre', "Conditions de garde, assurance, durée, propriété de la carte."],
      ['Livraison', `Zones desservies, délais annoncés (${RULES.shipping.fr.delay} en France), frais et assurance affichés avant validation, transfert des risques.`],
      ['Rachat', `Rachat à ${rate} % de la cote de référence pendant ${RULES.buybackLockMinutes} minutes après l'ouverture, ${laterRate} % ensuite ; définition de cette cote, crédit en avoir, conditions de versement par virement.`],
      ['Droit de rétractation', "Accord exprès du client pour une ouverture immédiate et renonciation au droit de rétractation, recueillis à chaque achat : validité à faire trancher par un juriste."],
      ['Garanties et réclamations', 'Garantie légale de conformité, service client, médiation de la consommation.'],
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
      ['Finalités et bases légales', 'Exécution du contrat, obligations légales (lutte contre le blanchiment), intérêt légitime, consentement.'],
      ['Destinataires', 'Prestataires de paiement, de vérification d’identité, de transport et d’hébergement.'],
      ['Durées de conservation', 'Par catégorie de données.'],
      ['Tes droits', 'Accès, rectification, effacement, opposition, portabilité ; réclamation auprès de la CNIL.'],
      ['Cookies', 'Traceurs utilisés et recueil du consentement.'],
    ],
    extra: "Cette démonstration ne collecte aucune donnée : ton compte, ton solde et tes adresses restent dans le stockage local de ton navigateur, et aucun traceur n'est déposé.",
  },
  mentions: {
    title: 'Mentions légales',
    sections: [
      ['Éditeur', `${BRAND.company} — ${BRAND.address}. Forme sociale, capital, numéro d'immatriculation et numéro de TVA à compléter.`],
      ['Directeur de la publication', 'À compléter.'],
      ['Hébergeur', 'Nom, adresse et contact de l’hébergeur à compléter.'],
      ['Contact', BRAND.email],
      ['Crédits', "Visuels et données de cartes : API Pokémon TCG (pokemontcg.io). Icônes : Lucide. Polices : Unbounded et Manrope (licence OFL). Pokémon et les noms de cartes sont des marques de leurs titulaires ; ce site n'est affilié à aucun d'eux."],
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
