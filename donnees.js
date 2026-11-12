// ---------------------------------------------------------------
// Lecture du fichier des lieux (donnees/pois.csv)
//
// Ce fichier sait :
//   - lire un CSV exporté par Excel (séparateur « ; » ou « , », UTF-8 ou Windows-1252) ;
//   - comprendre une position écrite en Plus Code (« CFH6+W2 Landéhen ») ou en
//     coordonnées (« 48.420630, -2.551762 », virgule décimale française acceptée) ;
//   - vérifier chaque ligne et expliquer en français ce qui ne va pas.
//
// Aucune dépendance : tout est dans ce fichier.
// ---------------------------------------------------------------

var JOURS_CSV = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
var OLC_ALPHABET = '23456789CFGHJMPQRVWX';

// Écart maximal toléré avec le centre de la commune (en degrés) : au-delà, c'est presque sûrement une faute de frappe
var ECART_MAX_LAT = 0.25;
var ECART_MAX_LNG = 0.35;

// « École Saint-Joseph » -> « ecolesaintjoseph » : sert à comparer sans tenir compte des accents, majuscules, espaces
function normaliser(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}

function echapperHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Texte d'un fichier : UTF-8 si possible, sinon Windows-1252 (ancien format d'Excel)
function decoderTexte(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch (e) {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

// ---------- CSV ----------

// Renvoie un tableau de lignes, chaque ligne étant un tableau de cellules (texte).
function lireCSV(texte) {
  if (texte.charCodeAt(0) === 0xFEFF) texte = texte.slice(1);   // marque UTF-8 ajoutée par Excel

  // Séparateur : celui qui revient le plus dans la première ligne
  var premiere = texte.split(/\r?\n/)[0] || '';
  var sep = ';', meilleur = -1;
  [';', ',', '\t'].forEach(function (c) {
    var n = premiere.split(c).length - 1;
    if (n > meilleur) { meilleur = n; sep = c; }
  });

  var lignes = [], ligne = [], cellule = '', entreGuillemets = false;
  for (var i = 0; i < texte.length; i++) {
    var c = texte[i];
    if (entreGuillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') { cellule += '"'; i++; } else { entreGuillemets = false; }
      } else {
        cellule += c;
      }
    } else if (c === '"' && cellule === '') {
      entreGuillemets = true;
    } else if (c === sep) {
      ligne.push(cellule); cellule = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++;
      ligne.push(cellule); cellule = '';
      lignes.push(ligne); ligne = [];
    } else {
      cellule += c;
    }
  }
  if (cellule !== '' || ligne.length) { ligne.push(cellule); lignes.push(ligne); }
  return lignes;
}

// ---------- Plus Codes (Open Location Code) ----------

// Les 8 premiers caractères du code du point donné (sert à compléter un code court)
function olcDebut(lat, lng) {
  lat = Math.min(Math.max(lat, -90), 90 - 1e-9) + 90;
  lng = ((lng + 180) % 360 + 360) % 360;
  var code = '', res = 20;
  for (var i = 0; i < 4; i++) {
    var a = Math.floor(lat / res), b = Math.floor(lng / res);
    code += OLC_ALPHABET[a] + OLC_ALPHABET[b];
    lat -= a * res; lng -= b * res; res /= 20;
  }
  return code;
}

// Centre de la zone désignée par un code complet sans le « + » (paires lat/lng, 10 caractères au plus)
function olcCentre(complet) {
  var n = Math.min(complet.length, 10) / 2;
  var lat = -90, lng = -180, res = 20;
  for (var p = 0; p < n; p++) {
    lat += OLC_ALPHABET.indexOf(complet[2 * p]) * res;
    lng += OLC_ALPHABET.indexOf(complet[2 * p + 1]) * res;
    if (p < n - 1) res /= 20;
  }
  return [lat + res / 2, lng + res / 2];
}

// « CFH6+W2 Landéhen » -> [latitude, longitude], ou null si ce n'est pas un Plus Code valide.
// Un code court est complété à partir du point de référence (le centre de la commune).
function decoderPlusCode(texte, refLat, refLng) {
  var jeton = String(texte).trim().split(/\s+/)[0].toUpperCase();
  if (!/^[23456789CFGHJMPQRVWX]+\+[23456789CFGHJMPQRVWX]*$/.test(jeton)) return null;

  var morceaux = jeton.split('+');
  var avant = morceaux[0], apres = morceaux[1];
  if (avant.length < 2 || avant.length > 8 || avant.length % 2 !== 0) return null;
  if (apres.length === 1) return null;

  var manquants = 8 - avant.length;
  var complet = jeton.replace('+', '');
  if (manquants > 0) complet = olcDebut(refLat, refLng).slice(0, manquants) + complet;

  var pos = olcCentre(complet);

  if (manquants > 0) {
    // Choisit la zone la plus proche du point de référence (cas d'un lieu au bord d'une zone)
    var res = Math.pow(20, 2 - manquants / 2), demi = res / 2;
    if (refLat + demi < pos[0] && pos[0] - res >= -90) pos[0] -= res;
    else if (refLat - demi > pos[0] && pos[0] + res <= 90) pos[0] += res;
    if (refLng + demi < pos[1]) pos[1] -= res;
    else if (refLng - demi > pos[1]) pos[1] += res;
  }
  return pos;
}

// Plus Code OU « latitude, longitude » -> [latitude, longitude], ou null
function lirePosition(texte, ref) {
  var t = String(texte).trim();
  if (!t) return null;
  var m = t.match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)/);
  if (m) {
    var lat = parseFloat(m[1].replace(',', '.'));
    var lng = parseFloat(m[2].replace(',', '.'));
    return (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) ? [lat, lng] : null;
  }
  return decoderPlusCode(t, ref[0], ref[1]);
}

// ---------- Champs ----------

// « Commerces », « commerce », « COMMERCES » ou « Services (école, mairie…) » -> la catégorie correspondante
function trouverCategorie(valeur, categories) {
  var n = normaliser(valeur);
  if (!n) return null;

  var exacte = categories.filter(function (c) { return normaliser(c.id) === n || normaliser(c.nom) === n; });
  if (exacte.length) return exacte[0];

  // Le texte commence par le nom d'une catégorie (« Services (école, mairie, etc.) »)
  var commence = categories.filter(function (c) { return n.indexOf(normaliser(c.nom)) === 0; });
  if (commence.length) {
    return commence.sort(function (a, b) { return b.nom.length - a.nom.length; })[0];
  }

  // Début de nom suffisamment long (« loisirs »)
  if (n.length >= 4) {
    var debut = categories.filter(function (c) { return normaliser(c.nom).indexOf(n) === 0; });
    if (debut.length === 1) return debut[0];
  }
  return null;
}

// Excel supprime le 0 initial d'un numéro saisi comme un nombre : on le remet
function nettoyerTelephone(t) {
  var chiffres = t.replace(/[\s.\-]/g, '');
  if (/^[1-9]\d{8}$/.test(chiffres)) chiffres = '0' + chiffres;
  if (/^0\d{9}$/.test(chiffres)) return chiffres.replace(/(\d{2})(?=\d)/g, '$1 ');
  return t;
}

function trouverColonne(index, noms) {
  for (var i = 0; i < noms.length; i++) {
    if (noms[i] in index) return index[noms[i]];
  }
  return undefined;
}

// ---------- Fichier complet ----------

// texte : contenu du CSV
// options : { categories, icones, reference }
// Renvoie { pois: [...], problemes: ['Ligne 5 ignorée : ...', ...], sansPosition: ['Nom', ...] }
// Une ligne dont la position est vide n'est pas une erreur : le lieu n'est simplement pas encore placé.
function lireLieux(texte, options) {
  var categories = options.categories, icones = options.icones || {}, ref = options.reference;
  var pois = [], problemes = [], sansPosition = [];

  var lignes = lireCSV(texte);
  if (!lignes.length) return { pois: [], problemes: ['Le fichier est vide.'], sansPosition: [] };

  // Colonnes (reconnues par leur titre, dans n'importe quel ordre)
  var index = {};
  lignes[0].forEach(function (titre, i) {
    var cle = normaliser(titre);
    if (cle && !(cle in index)) index[cle] = i;
  });

  var colNom = trouverColonne(index, ['nom']);
  var colCategorie = trouverColonne(index, ['categorie']);
  var colPosition = trouverColonne(index, ['position', 'pluscode', 'coordonnees', 'gps']);
  var manquantes = [];
  if (colNom === undefined) manquantes.push('Nom');
  if (colCategorie === undefined) manquantes.push('Catégorie');
  if (colPosition === undefined) manquantes.push('Position');
  if (manquantes.length) {
    return { pois: [], problemes: ['Colonne introuvable : ' + manquantes.join(', ') + '. Vérifiez les titres de la première ligne.'], sansPosition: [] };
  }

  var colAdresse = trouverColonne(index, ['adresse']);
  var colSite = trouverColonne(index, ['siteweb', 'siteinternet', 'site']);
  var colTel = trouverColonne(index, ['telephone', 'tel']);
  var colPhoto = trouverColonne(index, ['photo', 'image']);
  var colIcone = trouverColonne(index, ['icone', 'icon']);
  var colNote = trouverColonne(index, ['note', 'remarque', 'remarques']);
  var colApprox = trouverColonne(index, ['positionapproximative', 'approximatif']);
  var colJours = JOURS_CSV.map(function (j) { return index[j]; });

  function cellule(ligne, col) {
    return (col === undefined || ligne[col] === undefined) ? '' : String(ligne[col]).trim();
  }

  for (var r = 1; r < lignes.length; r++) {
    var ligne = lignes[r];
    var vide = ligne.every(function (c) { return String(c).trim() === ''; });
    if (vide) continue;

    var nom = cellule(ligne, colNom);
    var debut = 'Ligne ' + (r + 1);
    if (!nom) { problemes.push(debut + ' ignorée : le nom est vide.'); continue; }
    debut += ' (' + nom + ')';

    // Position vide : lieu pas encore placé sur la carte, ce n'est pas une erreur
    if (cellule(ligne, colPosition) === '') { sansPosition.push(nom); continue; }

    var texteCategorie = cellule(ligne, colCategorie);
    var categorie = trouverCategorie(texteCategorie, categories);
    if (!categorie) {
      problemes.push(debut + ' ignorée : catégorie « ' + texteCategorie + ' » inconnue (utilisez la liste déroulante).');
      continue;
    }

    var position = lirePosition(cellule(ligne, colPosition), ref);
    if (!position) {
      problemes.push(debut + ' ignorée : position illisible. Écrivez un Plus Code (ex. CFH6+W2 Landéhen) ou des coordonnées (ex. 48.4206, -2.5517).');
      continue;
    }
    if (Math.abs(position[0] - ref[0]) > ECART_MAX_LAT || Math.abs(position[1] - ref[1]) > ECART_MAX_LNG) {
      problemes.push(debut + ' ignorée : la position est trop loin de Landéhen (vérifiez le code ou les coordonnées).');
      continue;
    }

    // Icône : nom d'un dessin (« eglise »), emoji, ou celle de la catégorie
    var iconeSaisie = cellule(ligne, colIcone), icone;
    if (iconeSaisie && icones[normaliser(iconeSaisie)]) {
      icone = icones[normaliser(iconeSaisie)];
    } else if (iconeSaisie && !/[a-z0-9]{3,}/i.test(iconeSaisie)) {
      icone = echapperHtml(iconeSaisie);
    } else {
      if (iconeSaisie) problemes.push(debut + ' : icône « ' + iconeSaisie + ' » inconnue, celle de la catégorie est utilisée (mettez un emoji).');
      icone = echapperHtml(categorie.icone);
    }

    // Site web : accepte « www.exemple.fr » (https:// ajouté), refuse tout le reste
    var site = cellule(ligne, colSite), siteWeb = null;
    if (site) {
      if (/^https?:\/\//i.test(site)) siteWeb = site;
      else if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(site)) siteWeb = 'https://' + site;
      else problemes.push(debut + ' : site web « ' + site + ' » ignoré (adresse illisible).');
    }

    // Photo : chemin du fichier (ex. photos/mairie.jpg) ou adresse internet
    var photo = cellule(ligne, colPhoto) || null;
    if (photo && /^\s*(javascript|data|vbscript):/i.test(photo)) {
      problemes.push(debut + ' : photo ignorée (adresse non autorisée).');
      photo = null;
    }

    var horaires = colJours.map(function (c) { return cellule(ligne, c) || null; });
    if (horaires.every(function (h) { return h === null; })) horaires = null;

    var tel = cellule(ligne, colTel);
    var approx = ['oui', 'o', 'vrai', 'true', '1', 'x'].indexOf(normaliser(cellule(ligne, colApprox))) !== -1;

    pois.push({
      id: normaliser(nom) || ('lieu' + r),
      categorie: categorie.id,
      nom: nom,
      icone: icone,
      position: position,
      positionApprox: approx,
      adresse: cellule(ligne, colAdresse) || null,
      photo: photo,
      horaires: horaires,
      siteWeb: siteWeb,
      telephone: tel ? nettoyerTelephone(tel) : null,
      note: cellule(ligne, colNote) || null
    });
  }

  return { pois: pois, problemes: problemes, sansPosition: sansPosition };
}

// ---------- Lieux qui se superposent ----------

// Regroupe les lieux dont les marqueurs se chevaucheraient à l'écran.
//   pois     : lieux à afficher
//   projeter : fonction [lat, lng] -> { x, y } en pixels, pour le niveau de zoom actuel
//   seuil    : distance en pixels en dessous de laquelle deux lieux sont regroupés
// Renvoie une liste de groupes { pois, position, memePosition, categorie, x, y } :
//   position      moyenne des positions du groupe (là où se place le marqueur)
//   memePosition  true si tous les lieux sont au même endroit (zoomer ne les séparera jamais)
//   categorie     identifiant de la catégorie si tous les lieux en ont la même, sinon null
function regrouperLieux(pois, projeter, seuil) {
  var groupes = [];

  pois.forEach(function (poi) {
    var pt = projeter(poi.position);
    var groupe = null;
    for (var i = 0; i < groupes.length; i++) {
      var dx = groupes[i].x - pt.x, dy = groupes[i].y - pt.y;
      if (Math.sqrt(dx * dx + dy * dy) < seuil) { groupe = groupes[i]; break; }
    }
    if (!groupe) {
      groupe = { x: pt.x, y: pt.y, pois: [] };
      groupes.push(groupe);
    }
    groupe.pois.push(poi);
  });

  groupes.forEach(function (g) {
    var n = g.pois.length;
    g.position = [
      g.pois.reduce(function (s, p) { return s + p.position[0]; }, 0) / n,
      g.pois.reduce(function (s, p) { return s + p.position[1]; }, 0) / n
    ];
    var premier = g.pois[0].position;
    // 5e-5 degré ≈ 5 mètres
    g.memePosition = g.pois.every(function (p) {
      return Math.abs(p.position[0] - premier[0]) < 5e-5 && Math.abs(p.position[1] - premier[1]) < 5e-5;
    });
    var cat = g.pois[0].categorie;
    g.categorie = g.pois.every(function (p) { return p.categorie === cat; }) ? cat : null;
  });

  return groupes;
}
