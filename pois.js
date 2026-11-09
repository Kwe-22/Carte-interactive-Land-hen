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
//   telephone   texte (ex. "02 96 30 03 21")
//   note        remarque affichée en bas du panneau (ex. info à vérifier)
// ---------------------------------------------------------------

var POIS = [
  {
    id: 'eglise',
    nom: 'Église Saint-Guihen',
    icone: '⛪',
    position: [48.4302, -2.5392],
    positionApprox: true,
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
    telephone: '02 96 30 03 21',
    note: null
  },
  {
    id: 'boulangerie',
    nom: 'Boulangerie',
    icone: '🥖',
    position: [48.4299, -2.5384],
    positionApprox: true,
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
    telephone: '02 96 30 03 49',
    note: 'Nom, téléphone et horaires à vérifier : les annuaires consultés se contredisent.'
  },
  {
    id: 'bar-epicerie',
    nom: 'Bar-épicerie',
    icone: '🍺',
    position: [48.4305, -2.5396],
    positionApprox: true,
    adresse: null,
    photo: null,
    horaires: null,
    telephone: null,
    note: 'Aucune information fiable trouvée : à compléter.'
  }
];
