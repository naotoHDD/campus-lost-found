# Runbook d’exploitation

Toutes les commandes Linux sont lancées depuis la racine du projet. La variable suivante rend les exemples plus courts :

```bash
COMPOSE="docker compose --env-file docker/.env -f docker/compose.full.yml"
```

## Contrôle quotidien

```bash
$COMPOSE ps
curl --fail --silent --show-error http://127.0.0.1:8080/health
$COMPOSE logs --no-color --tail=100 backend proxy postgres
```

Résultat attendu pour `/health` : `status=ok` et `database=up`. Le conteneur `backend-seed` doit être `Exited (0)` ; c’est normal, car il s’agit d’une tâche ponctuelle.

## Déploiement d’une mise à jour

```bash
./scripts/backup.sh
git pull --ff-only
$COMPOSE build --pull
$COMPOSE up -d
$COMPOSE ps
curl --fail http://127.0.0.1:8080/health
```

Le démarrage du backend exécute `prisma migrate deploy` avant l’API. Ne jamais utiliser `prisma migrate dev` sur la VM.

## Sauvegarde

```bash
./scripts/backup.sh
```

Chaque sauvegarde horodatée contient :

- `postgres.dump` au format PostgreSQL personnalisé ;
- `uploads.tar.gz` pour les photos et preuves ;
- `n8n.tar.gz` pour le compte, les workflows et l’historique n8n ;
- `SHA256SUMS` pour détecter une archive altérée ;
- `metadata.txt`.

Le dossier `backups/` est ignoré par Git. Copier les sauvegardes vers un stockage chiffré distinct et conserver `docker/.env` dans un coffre-fort de secrets séparé. La clé `N8N_ENCRYPTION_KEY` d’origine est indispensable pour relire d’éventuels identifiants chiffrés n8n.

## Restauration

Cette opération remplace les données actuelles. Effectuer d’abord une nouvelle sauvegarde, puis :

```bash
./scripts/restore.sh backups/AAAAMMJJTHHMMSSZ --confirm
curl --fail http://127.0.0.1:8080/health
```

Se reconnecter ensuite avec un compte utilisateur, ouvrir une image existante et lancer manuellement le workflow n8n.

## Test PostgreSQL réel en local

Le test refuse toute base dont le nom ne se termine pas par `test`, `_test` ou `-test`.

Sous PowerShell :

```powershell
docker compose -f docker/compose.test.yml up -d --wait
$env:DATABASE_URL="postgresql://lost_found_test:lost_found_test_password@localhost:55432/lost_found_test?schema=public"
$env:JWT_SECRET="local-integration-test-secret-at-least-32-characters"
npm.cmd --prefix backend run prisma:deploy
npm.cmd --prefix backend run test:integration
docker compose -f docker/compose.test.yml down
```

Sous Linux, utiliser `export DATABASE_URL=...` et `export JWT_SECRET=...` avec les mêmes valeurs.

## Incidents courants

### Backend `unhealthy`

```bash
$COMPOSE logs --no-color --tail=200 backend postgres
set -a; source docker/.env; set +a
$COMPOSE exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Une erreur Prisma `P1000` signifie généralement que le volume PostgreSQL a été initialisé avec d’anciens identifiants. Ne pas supprimer le volume s’il contient des données utiles : sauvegarder ou rétablir les identifiants d’origine. Pour un environnement jetable uniquement, `down -v` réinitialise toutes les données.

### Port occupé

Modifier `APP_PORT` et `APP_ORIGIN` ensemble dans `docker/.env`, puis relancer `up -d`. Pour n8n, modifier `N8N_PUBLIC_PORT` et `N8N_ORIGIN` ensemble.

### Espace disque faible

```bash
df -h
docker system df
docker image prune
```

Ne pas exécuter `docker volume prune` : les volumes contiennent la base, les fichiers et n8n.

### Code de remise expiré ou verrouillé

Un participant modifie puis réenregistre le rendez-vous. Le backend génère alors un nouveau code valable 30 minutes et remet le compteur à cinq tentatives.

## Rotation des secrets

- Modifier `JWT_SECRET` déconnecte tous les utilisateurs ; redémarrer le backend ensuite.
- Modifier `POSTGRES_PASSWORD` nécessite de modifier d’abord le mot de passe du rôle dans PostgreSQL puis la valeur dans `docker/.env`.
- Ne pas remplacer `N8N_ENCRYPTION_KEY` sans exporter les identifiants n8n ou restaurer la clé d’origine.
- Après toute fuite, remplacer `AUTOMATION_API_KEY` dans `docker/.env` puis recréer backend et n8n.

## Arrêt et redémarrage

```bash
$COMPOSE down
$COMPOSE up -d
```

Ces commandes conservent les volumes. L’option `-v` est destructive et ne fait pas partie d’un arrêt normal.
