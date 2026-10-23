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
- `versions/` : copies de sauvegarde (`index-before-bot-2026-10-23.html` = avant les modifications du 23/10/2026).
- `cenacle-backup.html` : ancienne version (6 zones), pour mémoire.

## Historique
Voir `git log`.
