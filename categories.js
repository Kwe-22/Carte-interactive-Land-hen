// ---------------------------------------------------------------
// Réglages de la carte (rarement modifiés)
//
// Les LIEUX ne sont pas ici : ils sont dans donnees/pois.csv
// (fichier à modifier avec Excel, voir donnees/pois.xlsx).
// ---------------------------------------------------------------

// Centre de la vue de départ (église Saint-Guihen)
var CENTRE_DEPART = [48.42944, -2.54056];

// Point de référence pour comprendre les Plus Codes courts (ex. « CFH6+W2 Landéhen »)
var CENTRE_COMMUNE = [48.4292, -2.5394];

// Catégories de la barre de boutons (dans cet ordre).
//   nom      texte du bouton, à écrire à l'identique dans la colonne « Catégorie » du fichier
//   couleur  contour du bouton et des marqueurs de la catégorie
//   icone    emoji utilisé quand la colonne « Icône » d'un lieu est vide
var CATEGORIES = [
  { id: 'commerces',    nom: 'Commerces',                           couleur: '#F28C28', icone: '🛒' },  // orange
  { id: 'artisans',     nom: 'Artisans et services professionnels', couleur: '#3977C3', icone: '🔧' },  // bleu
  { id: 'services',     nom: 'Services',                            couleur: '#168C8C', icone: '🏛️' },  // turquoise
  { id: 'associations', nom: 'Associations et vie locale',          couleur: '#8B5FBF', icone: '🤝' },  // violet
  { id: 'loisirs',      nom: 'Loisirs et sport',                    couleur: '#E8C32E', icone: '⚽' },  // jaune
  { id: 'patrimoine',   nom: 'Patrimoine',                          couleur: '#C6534B', icone: '🏰' }   // rouge brique
];

// Dessins disponibles par leur nom dans la colonne « Icône » (en plus des emojis)
var ICONES = {
  eglise: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#4a4f57" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"><rect x="2.5" y="15" width="19" height="7" fill="#ece6da"/><rect x="8" y="9" width="8" height="13" fill="#d8d0bf"/><polygon points="12,3.6 16.6,9 7.4,9" fill="#5f7186"/><path d="M12 0.8V3.6M10.6 2.2H13.4" fill="none"/><path d="M10.5 22v-3.5a1.5 1.5 0 0 1 3 0V22z" fill="#7a4b2a"/><path d="M11 14v-1.6a1 1 0 0 1 2 0V14z" fill="#4a4f57"/></g></svg>'
};
