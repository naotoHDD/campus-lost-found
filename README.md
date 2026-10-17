# Lost & Found Tunisia

Application web complète pour publier, rechercher et restituer des objets perdus ou trouvés en Tunisie.

Cette livraison contient le frontend Angular, l’API NestJS, PostgreSQL, les migrations Prisma, les données initiales et un lancement Docker complet. L’automatisation n8n est volontairement reportée à une étape ultérieure et n’est pas incluse dans cette version.

## Démarrage le plus simple sous Windows

Prérequis :

- Docker Desktop démarré ;
- Node.js 22.22.3 ou une version plus récente ;
- environ 3 Go d’espace libre pour les images Docker.

Depuis l’Explorateur Windows, double-cliquer sur `START-WINDOWS.cmd`.

Ou depuis PowerShell, à la racine du projet :

```powershell
.\START-WINDOWS.cmd
```

Au premier lancement, le script :

1. génère automatiquement les mots de passe locaux dans `docker/.env` et `backend/.env` ;
2. construit les conteneurs ;
3. applique les migrations PostgreSQL ;
4. crée le compte administrateur et les catégories ;
5. démarre le site complet.

Accès :

- application : <http://localhost:8080>
- documentation API : <http://localhost:8080/api/docs>
- contrôle de santé : <http://localhost:8080/health>

L’adresse et le mot de passe administrateur sont affichés pendant la première configuration et conservés dans `docker/.env`. Ne pas publier ce fichier.

Pour arrêter l’application sans perdre la base de données ni les images :

```powershell
.\STOP-WINDOWS.cmd
```

## Démarrage complet en ligne de commande

```powershell
node scripts/setup-local.mjs
docker compose --env-file docker/.env -f docker/compose.full.yml up --build -d
```

Si les fichiers `.env` existent déjà, la première commande s’arrête sans les remplacer. Pour suivre les journaux :

```powershell
docker compose --env-file docker/.env -f docker/compose.full.yml logs -f
```

## Développement séparé

Ce mode expose l’API sur le port `3000` et lance Angular avec rechargement automatique sur le port `4200`.

Terminal 1, depuis la racine :

```powershell
docker compose --env-file docker/.env -f docker/compose.dev.yml up --build
```

Terminal 2 :

```powershell
npm.cmd ci --prefix frontend
npm.cmd start --prefix frontend
```

Le proxy Angular transfère automatiquement `/api` vers `http://localhost:3000`. Il n’est donc plus nécessaire de modifier l’URL de l’API dans le code.

## Fonctionnalités livrées

- inscription, connexion JWT et profil utilisateur ;
- publication d’objets perdus ou trouvés avec photo et localisation tunisienne ;
- recherche, filtres, détail d’annonce et gestion de ses annonces ;
- réclamations avec preuve privée et suivi du statut ;
- processus de restitution et notifications ;
- espace administrateur pour annonces, utilisateurs, réclamations, catégories et localisations ;
- interface responsive téléphone, tablette et ordinateur ;
- API documentée avec Swagger ;
- persistance PostgreSQL et stockage persistant des fichiers envoyés.

## Structure

```text
frontend/             Application Angular responsive
backend/              API NestJS, Prisma, tests et migrations
docker/               Compositions Docker et reverse proxy Nginx
scripts/              Génération sécurisée de la configuration locale
START-WINDOWS.cmd     Installation/lancement local guidé
STOP-WINDOWS.cmd      Arrêt sans suppression des données
PROJECT-FINAL.md      État fonctionnel et architecture
```

## Vérifications du code

```powershell
npm.cmd ci --prefix frontend
npm.cmd test --prefix frontend -- --watch=false
npm.cmd run build --prefix frontend

npm.cmd ci --prefix backend
npm.cmd test --prefix backend
npm.cmd run test:e2e --prefix backend
npm.cmd run build --prefix backend
```

## Réinitialisation locale

La commande suivante supprime définitivement la base locale et les fichiers envoyés :

```powershell
docker compose --env-file docker/.env -f docker/compose.full.yml down -v
```

Ne l’utiliser que si une remise à zéro complète est souhaitée.

## Dépannage rapide

- Si le téléchargement d’une image Docker se termine par `timeout awaiting response headers`, relancer simplement `START-WINDOWS.cmd` après avoir vérifié la connexion Internet ; Docker reprend les couches déjà reçues.
- Si PowerShell bloque `npm.ps1`, utiliser `npm.cmd` comme dans les commandes de ce guide.
- Si le port `8080` est déjà utilisé, modifier `APP_PORT` dans `docker/.env`, puis relancer le projet.
- Pour connaître l’état des services : `docker compose --env-file docker/.env -f docker/compose.full.yml ps`.
