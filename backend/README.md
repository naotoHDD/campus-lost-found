# Lost & Found Tunisia — API

API REST NestJS pour l’application, exposée sous `/api`. PostgreSQL est géré avec Prisma. Les photos publiques et les preuves privées sont stockées séparément.

## Développement local

Depuis la racine, exécuter une première fois :

```powershell
node scripts/setup-local.mjs
```

Puis démarrer PostgreSQL et l’API :

```powershell
docker compose --env-file docker/.env -f docker/compose.dev.yml up --build
```

La composition applique les migrations et lance automatiquement le seed idempotent. L’API est disponible sur <http://localhost:3000/api> et Swagger sur <http://localhost:3000/api/docs>.

Pour lancer NestJS directement sur l’hôte :

```powershell
Set-Location backend
npm.cmd ci
npm.cmd run prisma:generate
npm.cmd run prisma:deploy
npm.cmd run db:seed
npm.cmd run start:dev
```

## Commandes utiles

- `npm.cmd run prisma:generate` : génère le client Prisma.
- `npm.cmd run prisma:migrate` : crée une migration de développement.
- `npm.cmd run prisma:deploy` : applique les migrations existantes.
- `npm.cmd run db:seed` : crée/met à jour l’administrateur et les catégories.
- `npm.cmd run prisma:studio` : ouvre Prisma Studio.
- `npm.cmd test` : tests unitaires.
- `npm.cmd run test:e2e` : tests HTTP.
- `npm.cmd run lint` : analyse statique.
- `npm.cmd run build` : compilation de production.

Le seed utilise `prisma/seed.mjs` et fonctionne dans l’image Docker de production sans dépendre de `tsx`.

## Fichiers envoyés

`UPLOAD_DIR` doit pointer vers un dossier persistant et accessible en écriture. Les photos d’annonce acceptent PNG/JPEG ; les preuves de réclamation acceptent PNG/JPEG/PDF. La taille maximale est de 5 Mio. Les photos publiques sont servies sous `/api/files`, tandis que les preuves nécessitent la route authentifiée de la réclamation.

Les décisions d’architecture et le contrat frontend se trouvent dans `docs/`.
