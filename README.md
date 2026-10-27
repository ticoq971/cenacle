# Cénacle

Jeu d'action-évolution en 3D (Three.js r128), dans un seul fichier `index.html`.

## Lancer
- Double-cliquer `index.html` fonctionne, mais le plus fiable est un petit serveur local :
  `python -m http.server 5173` dans ce dossier, puis ouvrir http://localhost:5173/
- Three.js est chargé depuis `vendor/three.min.js` (hors ligne) ; s'il manque, le CDN cdnjs prend le relais.
- La coop et la sauvegarde en ligne ne marchent que dans l'artefact Claude (`window.claude`) ; en local, la sauvegarde reste dans le navigateur (localStorage).

## Fichiers
- `index.html` : le jeu (données des modèles et des plans incluses).
- `plans-niveaux.html` : éditeur et notes de conception des 8 niveaux.
- `models/` : exports Spline d'origine (personnages, objets, héros) ; le jeu utilise la copie incluse dans `index.html`.
- `vendor/three.min.js` : Three.js r128.
- `tools/verif-camera.js` : vérification automatique de la caméra, niveau par niveau (ouvrir le jeu, coller le fichier dans la console puis `await verifCamera()` ; rapport niveaux x points x échecs).
- `versions/` : copies de sauvegarde (`index-before-bot-2026-10-23.html` = avant les modifications du 23/10/2026).
- `cenacle-backup.html` : ancienne version (6 zones), pour mémoire.

## Historique
Voir `git log`.

## Coop en ligne
Réglages → Coop : crée une salle, partage le code (ou le lien), tes amis rejoignent avec le code (6 joueurs max). Connexion directe entre navigateurs (WebRTC, signalisation via relais publics nostr, bibliothèque Trystero, licence MIT dans vendor/). Sans compte ni serveur ; peut échouer sur certains réseaux 4G / d'entreprise.

## Sauvegarde en ligne (Cloudflare)
Sur https://cenacle.pages.dev, la partie est aussi sauvegardée sur le serveur (Cloudflare Pages Functions + D1, voir `functions/api/save.js` et `migrations/`). Aucun compte : l'appareil tire une clé aléatoire de 128 bits (stockée dans le navigateur) ; le serveur ne garde que son empreinte SHA-256. Réglages → Sauvegarde → « Code de récupération » affiche la clé (à garder secrète), « Restaurer avec un code » la saisit sur un autre appareil. La partie la plus avancée gagne ; une partie neuve n'écrase jamais rien ; la remise à zéro efface aussi la copie en ligne. Sans serveur (GitHub Pages, fichier local), le jeu reste en local.

## Sauvegarde
La partie est stockée dans le navigateur. Pour la transférer (PC ↔ iPhone) : Réglages → Partie → Exporter la sauvegarde, puis Importer sur l'autre appareil.


## Pré-calcul du monde (bake/)

Le démarrage reconstruit 12 villes, le terrain et la navigation (~18-20 s sur PC). Le terrain et le résultat de la validation de navigation sont pré-calculés dans `bake/<version>.bin` (gzip, ~7,5 Mo), où `<version>` est l'empreinte du code de construction du monde (scripts `data-boot` de `index.html`). Si le fichier est absent ou ne correspond pas au code, le jeu recalcule tout comme avant (plus lent, mais identique).

**Après toute modification du code de `index.html`, régénérer le fichier** : `node tools/srvb.js . 49341`, ouvrir `http://localhost:49341/index.html?nolangpick&bake`, attendre la fin du chargement, puis dans la console : `await bakeExport()` (écrit `bake/<version>.bin` et supprime l'ancien). `?nobake` force le calcul complet.

## Démarrage rapide : monde pré-calculé (`bake/`)
Au démarrage, le jeu construit le monde (plan des 12 zones, relief, validation de navigation…) : plusieurs secondes sur PC, beaucoup plus sur téléphone. Les résultats déterministes sont donc pré-calculés dans **un seul fichier** `bake/<version>.bin` (gzip) : plan du monde (`planInit` : PX, WATERS, BRIDGES, TP, FRP, HILL, GATESW ; FLATS est recalculé), relief (hauteurs, couleurs par triangle, normales recalculées à l'identique) et résultat de la validation de navigation (grilles, profondeur, déplacements de coffres, suppressions). `<version>` est une empreinte du code du jeu (balises `script[data-boot]` en ligne) : toute modification du code invalide le fichier, et le jeu retombe alors sur le calcul complet (plus lent, résultat identique). Ne pas oublier de **regénérer le fichier à chaque changement de `index.html`** (et de supprimer l'ancien : un seul `.bin` dans le dépôt).

Regénérer :
1. `node tools/srvb.js . 49321` (sert le dossier et accepte `POST /bake/<version>.bin`, en supprimant les anciens `.bin`) ;
2. ouvrir `http://127.0.0.1:49321/index.html?bake`, attendre la fin du chargement, puis dans la console `await bakeExport()` ;
3. commit du nouveau `bake/*.bin` + `index.html` (+ `sw.js` : changer `VERSION`).
`?nobake` force le calcul complet (comparaisons, dépannage).

Vérifier (calcul complet contre relecture) : `tools/verif-bake.js` calcule des empreintes profondes de toutes les variables globales (`window.BAKECP('pre'|'plan'|'built')`, appelées depuis le jeu) ; l'injecter avant le chargement (protocole CDP `Page.addScriptToEvaluateOnNewDocument`, avec `window.__NAMES` = `Runtime.globalLexicalScopeNames`), charger la page avec `?nobake` puis sans, et comparer `window.BAKEHASH`. Seules diffèrent, par construction, des variables non déterministes (`away`, `flames`, couleurs de sommets aléatoires du décor, ignorées) et des brouillons (`_ec`, `_ecr`, `NV.lastBox/lastOwn`).
`window.BOOTT` (étapes du chargement avec l'heure) et `window.BOOTF` (première image jouable) servent à mesurer le démarrage.

## Équilibrage (v27d, `SCL` / `EB` / `DIFFGRAD` dans `index.html`)
Échelle étalée : récompenses et coûts suivent `K(z) = SCL.k^z` (×1,32 par niveau, avant : ×4 par palier), les ennemis `SCL.e^z` (×1,5), les ennemis ordinaires du niveau z ≥ 2 sont calés sur le boss précédent (`EB.br`, `EB.bd`, `EB.rf[z]`), le boss a un facteur par niveau (`SCL.bmh[z]`, `SCL.bmd[z]`), `SCL.f` / `SCL.a` = fidèles / gains permanents par conversion, la récompense en fidèles croît comme (dégâts)^`EB.rx` (0,6). Les anciennes sauvegardes passent par `migr7` (Puissance / Vie de conversion replafonnées, fidèles ramenés à la nouvelle échelle ; niveaux d'amélioration, boss, églises conservés).
Outils (à coller dans la console du jeu chargé, `?nobake` inutile) : `tools/equilibrage-mesure.js` (`await tableEquilibrage()` : stats réelles par niveau), `tools/equilibrage-sim.js` (`await tableSim()` : temps de farm par niveau d'un héros simulé ; `await calibrerPetits()` / `calibrerBoss()` : recalage de `EB.rf` et `SCL.bmh/bmd` ; `await testMigration()`).
