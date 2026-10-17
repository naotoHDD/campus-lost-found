# Lost & Found Tunisia — Frontend Angular

Interface responsive Angular 22 conçue pour téléphone, tablette et ordinateur.

## Fonctionnalités

- accueil, recherche et filtres ;
- inscription, connexion et profil ;
- publication avec photo, gouvernorat, délégation, adresse et coordonnées ;
- carte Leaflet/OpenStreetMap et géolocalisation du navigateur ;
- annonces personnelles, réclamations, restitution et notifications ;
- espace d’administration distinct.

## Développement local

Le backend doit être actif sur `http://localhost:3000`.

```powershell
npm.cmd ci
npm.cmd start
```

Ouvrir <http://localhost:4200>. Le proxy de développement transmet `/api` au backend. L’application utilise aussi cette URL relative dans Docker afin de fonctionner derrière le reverse proxy sans modification de code.

## Vérifications

```powershell
npm.cmd test -- --watch=false
npm.cmd run build
```

La carte charge les tuiles OpenStreetMap depuis Internet. Le reste de l’application peut être exécuté localement avec Docker.
