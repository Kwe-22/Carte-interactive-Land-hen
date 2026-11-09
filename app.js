// Landéhen – code INSEE 22098
var CODE_INSEE = '22098';
var EGLISE = [48.4302, -2.5392];   // centre de la vue (église Saint-Guihen, position approximative)
var ZOOM_FACTOR = 3;               // vue initiale 3 fois plus zoomée que la commune entière

var JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

var map = L.map('map', { zoomSnap: 0.25 }).setView(EGLISE, 15);

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
      fillOpacity: 0.65,
      interactive: false
    }).addTo(map);

    // Trait de délimitation de la commune
    var outline = L.polygon(holes, {
      color: '#e63946',
      weight: 3,
      fill: false,
      interactive: false
    }).addTo(map);

    // Zoom qui cadre toute la commune, puis x3 centré sur l'église
    var zoomCommune = map.getBoundsZoom(outline.getBounds(), false, L.point(40, 40));
    map.setView(EGLISE, zoomCommune + Math.log2(ZOOM_FACTOR));
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

function openPanel(poi) {
  renderPoi(poi);
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  panel.scrollTop = 0;
  // Évite que le marqueur reste caché sous le panneau
  map.panInside(poi.position, { paddingBottomRight: [panel.offsetWidth + 24, 24] });
}

function closePanel() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

document.getElementById('panel-close').addEventListener('click', closePanel);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closePanel();
});

// ---------- Marqueurs des POI ----------

POIS.forEach(function (poi) {
  var icon = L.divIcon({
    className: 'poi-icon',
    html: '<span>' + poi.icone + '</span>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
  L.marker(poi.position, { icon: icon, title: poi.nom })
    .addTo(map)
    .on('click', function () { openPanel(poi); });
});
