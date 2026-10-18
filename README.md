# Lost & Found Tunisia

Application web complète pour publier, rechercher et restituer des objets perdus ou trouvés en Tunisie.

Cette livraison contient le frontend Angular, l’API NestJS, PostgreSQL, les migrations Prisma, les données initiales, un lancement Docker complet et une première automatisation n8n sécurisée pour suggérer les correspondances entre annonces.

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
5. génère les secrets n8n manquants sans remplacer la configuration existante ;
6. démarre le site complet.

Accès :

- application : valeur `APP_ORIGIN` de `docker/.env` (par défaut <http://localhost:8080>) ;
- documentation API : `${APP_ORIGIN}/api/docs` ;
- automatisation n8n : valeur `N8N_ORIGIN` de `docker/.env` (par défaut <http://localhost:5678>) ;
- contrôle de santé : `${APP_ORIGIN}/health`.

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
- réclamations avec preuve privée, boîte de réception et décision du propriétaire de l’annonce ;
- restitution sécurisée par code à six chiffres et double confirmation des participants ;
- expiration du code après 30 minutes, verrouillage après cinq erreurs et journalisation de sa validation ;
- détection automatique et dédupliquée des correspondances avec n8n ;
- espace administrateur pour annonces, utilisateurs, réclamations, catégories et localisations ;
- interface responsive téléphone, tablette et ordinateur ;
- API documentée avec Swagger ;
- persistance PostgreSQL et stockage persistant des fichiers envoyés.

## Structure

```text
frontend/             Application Angular responsive
backend/              API NestJS, Prisma, tests et migrations
docker/               Compositions Docker et reverse proxy Nginx
n8n/                  Workflow de matching et guide d’activation
scripts/              Génération sécurisée de la configuration locale
START-WINDOWS.cmd     Installation/lancement local guidé
IMPORT-N8N-WINDOWS.cmd Import initial du workflow n8n
STOP-WINDOWS.cmd      Arrêt sans suppression des données
INSTALLER-LA-VERSION-FINALE.md Mise à jour sûre du projet Windows existant
PROJECT-FINAL.md      État fonctionnel et architecture
docs/ARCHITECTURE.md  Architecture applicative et contrôles d’accès
docs/AUDIT-FINAL.md   Conformité exacte au cahier des charges
docs/RUNBOOK.md       Exploitation, sauvegarde, restauration et incidents
docs/VM-DEPLOYMENT.md Installation guidée sur Ubuntu Server
```

## Vérifications du code

```powershell
npm.cmd ci --prefix frontend
npm.cmd test --prefix frontend -- --watch=false
npm.cmd run build --prefix frontend

npm.cmd ci --prefix backend
npm.cmd test --prefix backend
npm.cmd run test:e2e --prefix backend
npm.cmd run lint --prefix backend
npm.cmd run build --prefix backend
```

La CI démarre aussi un vrai PostgreSQL isolé, applique toutes les migrations et exécute `test:integration`. La procédure locale équivalente se trouve dans [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

## Sauvegarde et VM

- sauvegarde/restauration : [`docs/RUNBOOK.md`](docs/RUNBOOK.md) ;
- architecture et sécurité : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ;
- déploiement Ubuntu Server : [`docs/VM-DEPLOYMENT.md`](docs/VM-DEPLOYMENT.md).

Sous Linux, `./scripts/backup.sh` sauvegarde PostgreSQL, les fichiers envoyés et n8n avec sommes SHA-256. La restauration destructive exige le paramètre explicite `--confirm`.

## Réinitialisation locale

La commande suivante supprime définitivement la base locale et les fichiers envoyés :

```powershell
docker compose --env-file docker/.env -f docker/compose.full.yml down -v
```

Ne l’utiliser que si une remise à zéro complète est souhaitée.

Cette commande supprime également le compte local, les workflows et l’historique n8n stockés dans le volume `n8n_data`.

## Activer le matching automatique n8n

Après le premier démarrage :

1. ouvrir l’adresse `N8N_ORIGIN` de `docker/.env`, généralement <http://localhost:5678>, et créer le compte propriétaire local ;
2. lancer `IMPORT-N8N-WINDOWS.cmd` une seule fois ;
3. rouvrir n8n, vérifier **Lost & Found - Automatic item matching** puis cliquer sur **Publish** ;
4. utiliser **Manual test** pour une première exécution immédiate.

Le workflow s’exécute ensuite toutes les dix minutes. Il compare uniquement les annonces actives et ne valide jamais automatiquement une réclamation. Le fonctionnement détaillé et le barème du score sont documentés dans [`n8n/README.md`](n8n/README.md).

## Dépannage rapide

- Si le téléchargement d’une image Docker se termine par `timeout awaiting response headers`, relancer simplement `START-WINDOWS.cmd` après avoir vérifié la connexion Internet ; Docker reprend les couches déjà reçues.
- Si PowerShell bloque `npm.ps1`, utiliser `npm.cmd` comme dans les commandes de ce guide.
- Si le port `8080` est déjà utilisé, modifier `APP_PORT` dans `docker/.env`, puis relancer le projet.
- Si `APP_PORT` change, modifier également le port présent dans `APP_ORIGIN` (par exemple `http://localhost:8090`).
- Si le port `5678` est déjà utilisé, définir `N8N_PUBLIC_PORT` et la même valeur dans `N8N_ORIGIN`.
- Pour connaître l’état des services : `docker compose --env-file docker/.env -f docker/compose.full.yml ps`.
