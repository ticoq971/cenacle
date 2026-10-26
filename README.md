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
