# Démarrage propre sous Windows

Utilisez le dépôt déjà créé dans `C:\Users\user\Code\campus-lost-found`, ou un autre chemin court ne contenant pas d’ancien dossier Git cassé.

## 1. Extraire l’archive

Pour une nouvelle extraction seulement, créez le dossier suivant dans PowerShell :

```powershell
New-Item -ItemType Directory -Path "C:\Users\user\Code" -Force
```

Extrayez ensuite l’archive directement dans ce dossier. Le projet doit se trouver ici :

```text
C:\Users\user\Code\campus-lost-found
```

## 2. Vérifier le dépôt Git

```powershell
Set-Location "C:\Users\user\Code\campus-lost-found"
if (Test-Path -LiteralPath ".git") {
    git status
} else {
    git init
    git branch -M main
    git status
}
```

Le dossier racine affiché par Git doit être `C:\Users\user\Code\campus-lost-found`.

## 3. Installer et vérifier le projet

```powershell
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build
```

## 4. Lancer l’application

Docker Desktop doit être ouvert. À la racine du projet :

```powershell
.\START-WINDOWS.cmd
```

Le script prépare les fichiers `.env`, construit les conteneurs, applique les migrations Prisma et initialise les données de démonstration.

## 5. Activer le workflow n8n

1. Ouvrir `http://localhost:5678/` et créer le compte propriétaire local.
2. À la racine du projet, lancer :

```powershell
.\IMPORT-N8N-WINDOWS.cmd
```

3. Rouvrir n8n, sélectionner **Lost & Found - Automatic item matching** et cliquer sur **Publish**.
4. Exécuter **Manual test** pour vérifier le premier traitement.

## 6. Commit et dépôt distant

Si un dépôt distant est déjà configuré, vérifier avec `git remote -v`, puis commit/push les changements. Sinon, créer sur GitHub un dépôt **vide**, sans README, licence ni `.gitignore`, puis ajouter `origin`.

```powershell
git add .
git commit -m "Complete functional and infrastructure compliance"
git branch -M main
if (-not (git remote | Select-String -SimpleMatch "origin")) {
    git remote add origin https://github.com/VOTRE-COMPTE/campus-lost-found.git
}
git push -u origin main
```

Remplacez `VOTRE-COMPTE` par votre identifiant GitHub.

## Sécurité

Ne versionnez pas les fichiers `.env`. Seuls les modèles `.env.example` sont inclus dans cette archive.
