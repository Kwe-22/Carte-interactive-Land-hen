// Landéhen – code INSEE 22098
// Réglages des catégories : categories.js — Lecture du fichier des lieux : donnees.js
var CODE_INSEE = '22098';
var FICHIER_LIEUX = 'donnees/pois.csv';   // fichier à modifier avec Excel (voir donnees/pois.xlsx)
var ZOOM_FACTOR = 6;               // vue initiale 6 fois plus zoomée que la commune entière
var MASK_OPACITY = 0.45;           // assombrissement de l'extérieur de la commune (0 = aucun, 1 = noir)
var MIN_ZOOM_SHARE = 0.25;         // au zoom minimum, la commune occupe environ ce quart de l'image (en surface)

var JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

var map = L.map('map', { zoomSnap: 0.25, maxBoundsViscosity: 1.0, zoomControl: false }).setView(CENTRE_DEPART, 15);
// Boutons +/- en bas à gauche (le haut est occupé par la barre de catégories)
L.control.zoom({ position: 'bottomleft' }).addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Contour : <a href="https://geo.api.gouv.fr">geo.api.gouv.fr</a>'
}).addTo(map);

function showMessage(text) {
  var el = document.getElementById('message');
  el.textContent = text;
  el.style.display = 'block';
}

// ---------- Contour de la commune + masque assombri ----------

// Convertit [lng, lat] (GeoJSON) en [lat, lng] (Leaflet)
function toLatLngs(ring) {
  return ring.map(function (p) { return [p[1], p[0]]; });
}

fetch('https://geo.api.gouv.fr/communes/' + CODE_INSEE +
      '?fields=nom,code,contour&format=json&geometry=contour')
  .then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(function (commune) {
    var geom = commune.contour;
    var polygons = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];

    // Anneaux extérieurs de la commune = "trous" dans le masque
    var holes = polygons.map(function (poly) { return toLatLngs(poly[0]); });

    // Grand rectangle couvrant toute la carte, percé à l'emplacement de la commune
    var world = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
    L.polygon([world].concat(holes), {
      stroke: false,
      fillColor: '#000',
      fillOpacity: MASK_OPACITY,
      interactive: false,
      // Leaflet ne dessine une forme que sur la zone visible + une marge, puis la redessine
      // à la fin du déplacement. Une grande marge évite de voir la carte non grisée pendant qu'on tire.
      renderer: L.svg({ padding: 2 })
    }).addTo(map);

    // Emprise de la commune (aucun tracé affiché : seule la différence de luminosité la délimite)
    var bounds = L.polygon(holes).getBounds();

    // Zoom qui cadre toute la commune
    var zoomCommune = map.getBoundsZoom(bounds, false, L.point(40, 40));

    // Zoom minimum : la commune occupe MIN_ZOOM_SHARE de l'image (1/4 de surface = moitié en largeur et en hauteur)
    var zoomMin = zoomCommune + Math.log2(Math.sqrt(MIN_ZOOM_SHARE));
    map.setView(bounds.getCenter(), zoomMin, { animate: false });
    map.setMinZoom(zoomMin);

    // Déplacements limités à la zone visible au zoom minimum
    map.setMaxBounds(map.getBounds());

    // Vue de départ : ZOOM_FACTOR fois plus zoomée que la commune entière, centrée sur l'église
    map.setView(CENTRE_DEPART, zoomCommune + Math.log2(ZOOM_FACTOR), { animate: false });
  })
  .catch(function (err) {
    console.error(err);
    showMessage('Impossible de charger le contour de la commune (' + err.message + ').');
  });

// ---------- Panneau d'informations ----------

var panel = document.getElementById('panel');
var panelContent = document.getElementById('panel-content');

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function section(title) {
  return el('h3', null, title);
}

function todo() {
  return el('p', 'todo', 'À compléter');
}

function renderPoi(poi) {
  panelContent.textContent = '';

  // Photo
  if (poi.photo) {
    var img = el('img', 'panel-photo');
    img.src = poi.photo;
    img.alt = poi.nom;
    panelContent.appendChild(img);
  } else {
    panelContent.appendChild(el('div', 'panel-nophoto', 'Pas de photo disponible'));
  }

  var body = el('div', 'panel-body');
  body.appendChild(el('h2', null, poi.nom));

  // Adresse
  body.appendChild(section('Adresse'));
  body.appendChild(poi.adresse ? el('p', null, poi.adresse) : todo());

  // Horaires
  body.appendChild(section("Horaires d'ouverture"));
  if (poi.horaires) {
    var table = el('table', 'hours');
    var aujourdhui = (new Date().getDay() + 6) % 7; // 0 = lundi
    JOURS.forEach(function (jour, i) {
      var tr = el('tr', i === aujourdhui ? 'today' : null);
      tr.appendChild(el('td', null, jour));
      tr.appendChild(el('td', null, poi.horaires[i] || '—'));
      table.appendChild(tr);
    });
    body.appendChild(table);
  } else {
    body.appendChild(todo());
  }

  // Site internet (seuls les liens http/https sont acceptés)
  body.appendChild(section('Site internet'));
  if (poi.siteWeb && /^https?:\/\//i.test(poi.siteWeb)) {
    var pw = el('p');
    var aw = el('a', null, poi.siteWeb.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
    aw.href = poi.siteWeb;
    aw.target = '_blank';
    aw.rel = 'noopener noreferrer';
    pw.appendChild(aw);
    body.appendChild(pw);
  } else {
    body.appendChild(todo());
  }

  // Téléphone
  body.appendChild(section('Téléphone'));
  if (poi.telephone) {
    var p = el('p');
    var a = el('a', null, poi.telephone);
    a.href = 'tel:' + poi.telephone.replace(/\s+/g, '');
    p.appendChild(a);
    body.appendChild(p);
  } else {
    body.appendChild(todo());
  }

  // Remarques
  var notes = [];
  if (poi.positionApprox) notes.push('Position sur la carte approximative.');
  if (poi.note) notes.push(poi.note);
  if (notes.length) body.appendChild(el('div', 'note', notes.join(' ')));

  panelContent.appendChild(body);
}

var currentPoi = null;   // lieu actuellement affiché dans le panneau

function openPanel(poi) {
  currentPoi = poi;
  renderPoi(poi);
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  panel.scrollTop = 0;
  // Évite que le marqueur reste caché sous le panneau
  map.panInside(poi.position, { paddingBottomRight: [panel.offsetWidth + 24, 24] });
}

function closePanel() {
  currentPoi = null;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

document.getElementById('panel-close').addEventListener('click', closePanel);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closePanel();
});

// ---------- Couleurs des catégories ----------

var COULEURS = {};
CATEGORIES.forEach(function (c) { COULEURS[c.id] = c.couleur; });

// Texte blanc par défaut ; foncé seulement si le blanc manque de contraste (orange, jaune)
function luminance(hex) {
  var v = [1, 3, 5].map(function (i) {
    var c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function textColorOn(hex) {
  var contrastWhite = 1.05 / (luminance(hex) + 0.05);
  return contrastWhite >= 4 ? '#fff' : '#1d1d1f';
}

// ---------- Lieux : marqueurs et barre de catégories ----------

var markers = [];            // { poi, marker }
var activeCategory = null;   // null = tous les lieux affichés
var categoriesBar = document.getElementById('categories');
var emptyMessage = document.getElementById('category-empty');
var categoryButtons = [];    // { id, button }

function applyCategoryFilter() {
  var visibleCount = 0;
  markers.forEach(function (m) {
    var visible = !activeCategory || m.poi.categorie === activeCategory;
    if (visible) visibleCount++;
    if (visible && !map.hasLayer(m.marker)) m.marker.addTo(map);
    if (!visible && map.hasLayer(m.marker)) map.removeLayer(m.marker);
  });

  categoryButtons.forEach(function (cb) {
    cb.button.setAttribute('aria-pressed', cb.id === activeCategory ? 'true' : 'false');
  });

  emptyMessage.style.display = (activeCategory && visibleCount === 0) ? 'block' : 'none';

  // Referme la fiche si son lieu n'est plus affiché
  if (currentPoi && activeCategory && currentPoi.categorie !== activeCategory) closePanel();
}

// Affiche les lieux sur la carte (peut être rappelée : elle remplace ce qui était affiché)
function afficherLieux(pois) {
  closePanel();
  markers.forEach(function (m) { if (map.hasLayer(m.marker)) map.removeLayer(m.marker); });
  markers = [];
  activeCategory = null;
  categoriesBar.textContent = '';
  categoryButtons = [];

  pois.forEach(function (poi) {
    var couleur = COULEURS[poi.categorie];
    var icon = L.divIcon({
      className: 'poi-icon',
      html: '<span' + (couleur ? ' style="--cat:' + couleur + '"' : '') + '>' + poi.icone + '</span>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    var marker = L.marker(poi.position, { icon: icon, title: poi.nom })
      .addTo(map)
      .on('click', function () { openPanel(poi); });
    markers.push({ poi: poi, marker: marker });
  });

  CATEGORIES.forEach(function (cat) {
    var count = pois.filter(function (p) { return p.categorie === cat.id; }).length;

    var button = el('button', 'cat-btn' + (count === 0 ? ' empty' : ''));
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--cat', cat.couleur);
    var texte = textColorOn(cat.couleur);
    button.style.setProperty('--cat-text', texte);
    if (texte !== '#fff') button.classList.add('dark-text');
    button.appendChild(el('span', null, cat.nom));
    button.appendChild(el('span', 'count', String(count)));

    // Un clic sélectionne la catégorie ; un second clic dessus affiche de nouveau tous les lieux
    button.addEventListener('click', function () {
      activeCategory = (activeCategory === cat.id) ? null : cat.id;
      applyCategoryFilter();
    });

    categoriesBar.appendChild(button);
    categoryButtons.push({ id: cat.id, button: button });
  });
  applyCategoryFilter();
}

// ---------- Chargement du fichier des lieux ----------

var dataMessage = document.getElementById('data-message');

function masquerMessageDonnees() {
  dataMessage.style.display = 'none';
  dataMessage.textContent = '';
}

// Affiche la liste des lignes à corriger dans le fichier (si besoin)
function afficherProblemes(problemes) {
  masquerMessageDonnees();
  if (!problemes.length) return;
  dataMessage.appendChild(el('strong', null,
    problemes.length === 1 ? 'À corriger dans le fichier des lieux :' : problemes.length + ' points à corriger dans le fichier des lieux :'));
  var liste = el('ul');
  problemes.slice(0, 8).forEach(function (p) { liste.appendChild(el('li', null, p)); });
  if (problemes.length > 8) liste.appendChild(el('li', null, '… et ' + (problemes.length - 8) + ' autre(s).'));
  dataMessage.appendChild(liste);
  var fermer = el('button', 'toast-close', 'Fermer');
  fermer.type = 'button';
  fermer.addEventListener('click', masquerMessageDonnees);
  dataMessage.appendChild(fermer);
  dataMessage.style.display = 'block';
}

function chargerLieux(texte) {
  var resultat = lireLieux(texte, { categories: CATEGORIES, icones: ICONES, reference: CENTRE_COMMUNE });
  afficherLieux(resultat.pois);
  afficherProblemes(resultat.problemes);
}

// Repli : si le fichier ne peut pas être lu automatiquement (page ouverte directement depuis
// l'ordinateur, par exemple), on propose de le choisir à la main.
function proposerChoixDuFichier() {
  masquerMessageDonnees();
  dataMessage.appendChild(el('p', null,
    'Le fichier des lieux (' + FICHIER_LIEUX + ') ne peut pas être lu automatiquement ici. Choisissez-le manuellement :'));
  var champ = el('input');
  champ.type = 'file';
  champ.accept = '.csv,.txt,text/csv';
  champ.addEventListener('change', function () {
    var fichier = champ.files && champ.files[0];
    if (!fichier) return;
    var lecteur = new FileReader();
    lecteur.onload = function () { chargerLieux(decoderTexte(lecteur.result)); };
    lecteur.readAsArrayBuffer(fichier);
  });
  dataMessage.appendChild(champ);
  dataMessage.style.display = 'block';
}

fetch(FICHIER_LIEUX, { cache: 'no-store' })
  .then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.arrayBuffer();
  })
  .then(function (buffer) { chargerLieux(decoderTexte(buffer)); })
  .catch(function (err) {
    console.error(err);
    proposerChoixDuFichier();
  });
