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

// groupe : si la fiche est ouverte depuis une liste de lieux au même endroit, on propose un bouton de retour
function renderPoi(poi, groupe) {
  panelContent.textContent = '';

  if (groupe) {
    var retour = el('button', 'back-btn', '← Retour aux ' + groupe.pois.length + ' lieux de cet endroit');
    retour.type = 'button';
    retour.addEventListener('click', function () { openGroupPanel(groupe); });
    panelContent.appendChild(retour);
  }

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

var currentPoi = null;     // lieu actuellement affiché dans le panneau
var currentGroup = null;   // groupe de lieux (même endroit) dont la liste est affichée dans le panneau

function montrerPanneau(position) {
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  panel.scrollTop = 0;
  // Évite que le marqueur reste caché sous le panneau
  map.panInside(position, { paddingBottomRight: [panel.offsetWidth + 24, 24] });
}

function openPanel(poi, groupe) {
  currentPoi = poi;
  currentGroup = null;
  renderPoi(poi, groupe);
  montrerPanneau(poi.position);
}

// Liste des lieux situés au même endroit (un clic sur un lieu ouvre sa fiche)
function openGroupPanel(groupe) {
  currentPoi = null;
  currentGroup = groupe;
  panelContent.textContent = '';

  var body = el('div', 'panel-body');
  body.appendChild(el('h2', null, groupe.pois.length + ' lieux à cet endroit'));

  var liste = el('ul', 'group-list');
  groupe.pois.forEach(function (poi) {
    var li = el('li');
    var bouton = el('button', 'group-item');
    bouton.type = 'button';

    var pastille = el('span', 'group-dot');
    pastille.style.background = COULEURS[poi.categorie] || '#888';
    bouton.appendChild(pastille);

    var icone = el('span', 'group-icon');
    icone.innerHTML = poi.icone;   // emoji (échappé) ou dessin défini dans categories.js
    bouton.appendChild(icone);

    var textes = el('span', 'group-text');
    textes.appendChild(el('span', 'group-name', poi.nom));
    textes.appendChild(el('span', 'group-cat', NOMS_CATEGORIES[poi.categorie] || ''));
    bouton.appendChild(textes);

    bouton.addEventListener('click', function () { openPanel(poi, groupe); });
    li.appendChild(bouton);
    liste.appendChild(li);
  });
  body.appendChild(liste);
  panelContent.appendChild(body);

  montrerPanneau(groupe.position);
}

function closePanel() {
  currentPoi = null;
  currentGroup = null;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

document.getElementById('panel-close').addEventListener('click', closePanel);
// Le panneau se referme dès qu'on fait glisser la carte (le recentrage automatique à l'ouverture d'une fiche
// n'est pas un glissement : Leaflet n'envoie « dragstart » que pour un déplacement fait par la personne)
map.on('dragstart', closePanel);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closePanel();
});

// ---------- Couleurs des catégories ----------

var COULEURS = {}, NOMS_CATEGORIES = {};
CATEGORIES.forEach(function (c) { COULEURS[c.id] = c.couleur; NOMS_CATEGORIES[c.id] = c.nom; });

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

// ---------- Lieux : marqueurs, regroupement et barre de catégories ----------

var SEUIL_REGROUPEMENT = 40;   // deux marqueurs plus proches que ça (en pixels) sont regroupés en un seul
var tousLesLieux = [];         // tous les lieux lus dans le fichier
var markers = [];              // marqueurs actuellement posés sur la carte
var activeCategory = null;     // null = tous les lieux affichés
var categoriesBar = document.getElementById('categories');
var emptyMessage = document.getElementById('category-empty');
var categoryButtons = [];      // { id, button }

function lieuxVisibles() {
  return tousLesLieux.filter(function (p) { return !activeCategory || p.categorie === activeCategory; });
}

// Info-bulle commune à tous les lieux, isolés ou déployés depuis un groupe : même aspect, même position
var INFOBULLE = { direction: 'top', offset: [0, -18] };

// Nom lu par les lecteurs d'écran. On n'utilise pas l'attribut title : il ferait apparaître
// en plus l'info-bulle du navigateur, différente de celle de la carte.
function nommerMarqueur(marker, texte) {
  var element = marker.getElement && marker.getElement();
  if (element) {
    element.setAttribute('aria-label', texte);
    element.setAttribute('role', 'button');
  }
}

function iconeLieu(poi, classe) {
  var couleur = COULEURS[poi.categorie];
  return L.divIcon({
    className: 'poi-icon' + (classe ? ' ' + classe : ''),
    html: '<span' + (couleur ? ' style="--cat:' + couleur + '"' : '') + '>' + poi.icone + '</span>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

// Marqueur d'un groupe de lieux : un cercle avec leur nombre, à la couleur de la catégorie si elle est commune
function iconeGroupe(groupe) {
  var couleur = groupe.categorie ? COULEURS[groupe.categorie] : null;
  return L.divIcon({
    className: 'poi-icon poi-cluster',
    html: '<span' + (couleur ? ' style="--cat:' + couleur + '"' : ' class="mixte"') + '>' + groupe.pois.length + '</span>',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

// Clic sur un groupe : on zoome pour séparer les lieux ; s'ils sont au même endroit
// (ou si on ne peut plus zoomer), on affiche la liste dans le panneau
function cliquerGroupe(groupe) {
  fermerEventail();
  if (groupe.memePosition || map.getZoom() >= map.getMaxZoom() - 0.5) {
    openGroupPanel(groupe);
    return;
  }
  var positions = groupe.pois.map(function (p) { return p.position; });
  map.fitBounds(L.latLngBounds(positions), { padding: [70, 70], maxZoom: map.getMaxZoom() });
}

// ---------- Survol d'un groupe : les lieux se déploient autour du marqueur ----------

var DELAI_FERMETURE = 350;   // ms : laisse le temps d'aller du centre vers un lieu sans que tout se referme
var eventail = null;         // { groupe, elements: [couches Leaflet], minuteur }

function annulerFermeture() {
  if (eventail && eventail.minuteur) { clearTimeout(eventail.minuteur); eventail.minuteur = null; }
}

function planifierFermeture() {
  if (!eventail) return;
  annulerFermeture();
  eventail.minuteur = setTimeout(fermerEventail, DELAI_FERMETURE);
}

function fermerEventail() {
  if (!eventail) return;
  annulerFermeture();
  eventail.elements.forEach(function (couche) { map.removeLayer(couche); });
  eventail = null;
}

function ouvrirEventail(groupe) {
  if (eventail && eventail.groupe === groupe) { annulerFermeture(); return; }
  fermerEventail();

  var n = groupe.pois.length;
  if (n > EVENTAIL_MAX) return;   // trop de lieux : la liste du panneau reste disponible au clic

  // Zone où l'éventail doit tenir : sous la barre de catégories, hors du panneau s'il est ouvert
  var taille = map.getSize();
  var zone = {
    x0: 20, y0: 70,
    x1: taille.x - 20 - (panel.classList.contains('open') ? panel.offsetWidth : 0),
    y1: taille.y - 20
  };
  var centreEcran = map.latLngToContainerPoint(L.latLng(groupe.position));
  var orientation = choisirOrientation(n, centreEcran, zone);
  var decalages = positionsEventail(n, orientation);

  var centre = map.latLngToLayerPoint(L.latLng(groupe.position));
  var elements = [];
  var nouveau = { groupe: groupe, elements: elements, minuteur: null };
  eventail = nouveau;

  decalages.forEach(function (decalage, i) {
    var poi = groupe.pois[i];
    var position = map.layerPointToLatLng(centre.add(L.point(decalage.dx, decalage.dy)));

    // Trait entre le centre du groupe et le lieu
    var trait = L.polyline([L.latLng(groupe.position), position], {
      color: '#3a3f47', weight: 2, opacity: 0.7, interactive: false
    }).addTo(map);
    elements.push(trait);

    var satellite = L.marker(position, { icon: iconeLieu(poi, 'eventail'), zIndexOffset: 1000, keyboard: false })
      .bindTooltip(poi.nom, INFOBULLE)
      .on('mouseover', annulerFermeture)
      .on('mouseout', planifierFermeture)
      .on('click', function () { fermerEventail(); openPanel(poi, groupe); })
      .addTo(map);
    nommerMarqueur(satellite, poi.nom);
    elements.push(satellite);
  });
}

// Le déploiement n'a plus de sens dès que la carte bouge
map.on('dragstart', fermerEventail);
map.on('zoomstart', fermerEventail);

// Repose tous les marqueurs : appelée à chaque changement de filtre et de zoom
function redessinerMarqueurs() {
  fermerEventail();
  markers.forEach(function (m) { map.removeLayer(m); });
  markers = [];

  var groupes = regrouperLieux(lieuxVisibles(), function (position) {
    return map.project(L.latLng(position), map.getZoom());
  }, SEUIL_REGROUPEMENT);

  groupes.forEach(function (groupe) {
    var marker, nom;
    if (groupe.pois.length === 1) {
      var poi = groupe.pois[0];
      nom = poi.nom;
      marker = L.marker(poi.position, { icon: iconeLieu(poi) })
        .bindTooltip(poi.nom, INFOBULLE)
        .on('click', function () { openPanel(poi); });
    } else {
      // Pas d'info-bulle sur un groupe : c'est son déploiement, au survol, qui montre les noms
      nom = groupe.pois.length + ' lieux';
      marker = L.marker(groupe.position, { icon: iconeGroupe(groupe) })
        .on('click', function () { cliquerGroupe(groupe); })
        .on('mouseover', function () { ouvrirEventail(groupe); })
        .on('mouseout', planifierFermeture);
    }
    marker.addTo(map);
    nommerMarqueur(marker, nom);
    markers.push(marker);
  });
}

map.on('zoomend', redessinerMarqueurs);

function applyCategoryFilter() {
  redessinerMarqueurs();

  categoryButtons.forEach(function (cb) {
    cb.button.setAttribute('aria-pressed', cb.id === activeCategory ? 'true' : 'false');
  });

  emptyMessage.style.display = (activeCategory && lieuxVisibles().length === 0) ? 'block' : 'none';

  // Referme le panneau s'il montre un lieu qui n'est plus affiché, ou une liste devenue périmée
  if (currentGroup || (currentPoi && activeCategory && currentPoi.categorie !== activeCategory)) closePanel();
}

// Affiche les lieux sur la carte (peut être rappelée : elle remplace ce qui était affiché)
function afficherLieux(pois) {
  closePanel();
  tousLesLieux = pois;
  activeCategory = null;
  categoriesBar.textContent = '';
  categoryButtons = [];

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
  if (resultat.sansPosition.length) {
    console.info(resultat.sansPosition.length + ' lieu(x) pas encore placé(s) sur la carte (position vide) : ' + resultat.sansPosition.join(', '));
  }
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
