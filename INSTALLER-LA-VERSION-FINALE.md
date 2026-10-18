# Installer la version finale sans perdre les données

Cette livraison contient le projet complet. Elle ne contient ni `.git`, ni fichiers `.env`, ni volumes Docker, ni `node_modules`.

## 1. Conserver l’état actuel

Dans PowerShell :

```powershell
Set-Location "C:\Users\user\Code\campus-lost-found"
docker compose --env-file .\docker\.env -f .\docker\compose.full.yml down
Copy-Item .\docker\.env "$env:USERPROFILE\Desktop\campus-docker.env.backup"
Copy-Item .\backend\.env "$env:USERPROFILE\Desktop\campus-backend.env.backup" -ErrorAction SilentlyContinue
git status
```

Ne pas utiliser `down -v` : les volumes contiennent la base, les fichiers envoyés et n8n.

## 2. Extraire l’archive

L’archive contient un dossier racine `campus-lost-found`. L’extraire avec remplacement dans :

```text
C:\Users\user\Code
```

Le résultat doit rester :

```text
C:\Users\user\Code\campus-lost-found
```

Le dossier `.git` et les fichiers `.env` existants restent présents, car l’archive ne les remplace pas.

## 3. Reconstruire toute la stack

```powershell
Set-Location "C:\Users\user\Code\campus-lost-found"
docker compose --env-file .\docker\.env -f .\docker\compose.full.yml up -d --build --force-recreate
docker compose --env-file .\docker\.env -f .\docker\compose.full.yml ps -a
$appOriginLine = Get-Content .\docker\.env | Where-Object { $_ -like "APP_ORIGIN=*" } | Select-Object -First 1
$appOrigin = ($appOriginLine -split "=", 2)[1]
Invoke-RestMethod "$appOrigin/health"
```

Si `APP_PORT` n’est pas `8080`, utiliser l’adresse `APP_ORIGIN` présente dans `docker\.env`. La nouvelle migration de sécurité est appliquée automatiquement au démarrage du backend.

Résultat attendu pour la santé :

```text
status   : ok
database : up
```

Le service `backend-seed` doit terminer avec le code `0`. Les autres services doivent être `Up` et les services possédant un healthcheck doivent être `healthy`.

## 4. Vérifier les deux étapes corrigées

### Étape 1 — Fonctionnel

1. Ouvrir une annonce avec un compte différent de son auteur.
2. Cliquer sur **Réclamer cet objet** : la question réelle du déposant doit apparaître.
3. Vérifier le refus des fichiers autres que JPG, PNG ou PDF et de plus de 5 Mo.
4. Avec un administrateur, ouvrir **Catégories** puis **Localisations** et tester **Modifier**.
5. Sur ordinateur, vérifier le lien **Activité** dans l’en-tête.

### Étape 2 — Sécurité et base réelle

1. Accepter une réclamation et enregistrer un rendez-vous.
2. Vérifier que le code affiche une expiration et cinq tentatives.
3. Après cinq codes faux, replanifier le rendez-vous pour obtenir un nouveau code.
4. Vérifier qu’un code correct débloque la double confirmation.

Le test PostgreSQL automatisé local est documenté dans `docs/RUNBOOK.md`. Il utilise une base temporaire distincte et refuse de s’exécuter sur une base ne portant pas un nom de test.

## 5. Enregistrer dans Git

```powershell
git status
git add .
git commit -m "Complete functional and infrastructure compliance"
git push origin main
```

Après le push, attendre que les jobs GitHub Actions `frontend` et `backend` soient verts. La protection de `main` et la création de `develop` restent des actions manuelles décrites dans `CONTRIBUTING.md`.
