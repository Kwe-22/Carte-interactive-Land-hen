// ---------------------------------------------------------------
// Points d'intérêt (POI) de Landéhen
//
// Pour ajouter un POI : copier un bloc { ... } ci-dessous, puis
// modifier ses champs. Un champ sans information se laisse à null
// (le panneau affichera « À compléter »).
//
//   id          identifiant unique (sans espace)
//   nom         nom affiché
//   icone       emoji affiché sur la carte
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

var POIS = [
  {
    id: 'eglise',
    nom: 'Église Saint-Guihen',
    icone: '⛪',
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
