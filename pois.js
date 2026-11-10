// ---------------------------------------------------------------
// Points d'intérêt (POI) de Landéhen
//
// Pour ajouter un POI : copier un bloc { ... } ci-dessous, puis
// modifier ses champs. Un champ sans information se laisse à null
// (le panneau affichera « À compléter »).
//
//   id          identifiant unique (sans espace)
//   categorie   identifiant d'une catégorie de la liste CATEGORIES ci-dessous
//   nom         nom affiché
//   icone       emoji affiché sur la carte (ou un dessin <svg>...</svg>, comme pour l'église)
//   position    [latitude, longitude]
//   positionApprox  true si la position n'est pas exacte
//   adresse     texte
//   photo       chemin ou URL d'une image (ex. "photos/mairie.jpg")
//   horaires    7 valeurs, de lundi à dimanche
//               (texte, "Fermé", ou null si inconnu)
//   siteWeb     adresse complète du site (ex. "https://www.landehen.fr")
//   telephone   texte (ex. "02 96 30 03 21")
//   note        remarque affichée en bas du panneau (ex. info à vérifier)
// ---------------------------------------------------------------

// Catégories affichées dans la barre de boutons en haut de la carte (dans cet ordre)
var CATEGORIES = [
  { id: 'commerces',     nom: 'Commerces' },
  { id: 'artisans',      nom: 'Artisans et services professionnels' },
  { id: 'services',      nom: 'Services' },
  { id: 'associations',  nom: 'Associations et vie locale' },
  { id: 'loisirs',       nom: 'Loisirs et sport' },
  { id: 'patrimoine',    nom: 'Patrimoine' }
];

var POIS = [
  {
    id: 'eglise',
    categorie: 'patrimoine',
    nom: 'Église Saint-Guihen',
    icone: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#4a4f57" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"><rect x="2.5" y="15" width="19" height="7" fill="#ece6da"/><rect x="8" y="9" width="8" height="13" fill="#d8d0bf"/><polygon points="12,3.6 16.6,9 7.4,9" fill="#5f7186"/><path d="M12 0.8V3.6M10.6 2.2H13.4" fill="none"/><path d="M10.5 22v-3.5a1.5 1.5 0 0 1 3 0V22z" fill="#7a4b2a"/><path d="M11 14v-1.6a1 1 0 0 1 2 0V14z" fill="#4a4f57"/></g></svg>',
    position: [48.42944, -2.54056],  // Plus Code CFH5+QQ
    positionApprox: false,
    adresse: null,
    photo: null,
    horaires: null,
    telephone: null,
    note: null
  },
  {
    id: 'mairie',
    categorie: 'services',
    nom: 'Mairie de Landéhen',
    icone: '🏛️',
    position: [48.42981, -2.53994],  // Plus Code CFH6+W2
    positionApprox: false,
    adresse: '7 place du Bourg, 22400 Landéhen',
    photo: null,
    horaires: [
      '8h30 – 12h15',
      '8h30 – 12h15',
      '8h30 – 12h15',
      '8h30 – 12h15',
      '8h30 – 12h15',
      '9h00 – 12h00',
      'Fermé'
    ],
    siteWeb: 'http://www.landehen.fr',
    telephone: '02 96 30 03 21',
    note: null
  },
  {
    id: 'boulangerie',
    categorie: 'commerces',
    nom: 'Boulangerie Romelie',
    icone: '🥖',
    position: [48.42994, -2.54056],  // Plus Code CFH5+XQ
    positionApprox: false,
    adresse: '2 rue de Mauny, 22400 Landéhen',
    photo: null,
    horaires: [
      'Fermé',
      '7h30 – 13h30 / 15h30 – 19h00',
      '7h30 – 13h30',
      '7h30 – 13h30 / 15h30 – 19h00',
      '7h30 – 13h30 / 15h30 – 19h00',
      '7h30 – 13h30 / 15h30 – 19h00',
      '7h30 – 13h00'
    ],
    telephone: null,
    note: 'Nom et adresse confirmés. Horaires issus d\'un annuaire en ligne, à vérifier. Téléphone à compléter.'
  },
  {
    id: 'bar-epicerie',
    categorie: 'commerces',
    nom: 'Bar-épicerie',
    icone: '🍺',
    position: [48.42906, -2.53906],  // Plus Code CFH6+J9
    positionApprox: false,
    adresse: null,
    photo: null,
    horaires: null,
    telephone: null,
    note: 'Aucune information fiable trouvée : à compléter.'
  },
  {
    id: 'ecole',
    categorie: 'services',
    nom: 'École Saint-Joseph',
    icone: '🏫',
    position: [48.42894, -2.54231],  // Plus Code CFH5+H3
    positionApprox: false,
    adresse: '2 rue des Roseaux, 22400 Landéhen',
    photo: null,
    horaires: null,
    siteWeb: null,
    telephone: null,
    note: 'Adresse à vérifier (lue dans un annuaire en ligne). Horaires et téléphone à compléter.'
  }
];
