# Démarrage propre sous Windows

Utilisez un chemin court, hors de l’ancien dossier `Documents\Projets`.

## 1. Extraire l’archive

Créez le dossier suivant dans PowerShell :

```powershell
New-Item -ItemType Directory -Path "C:\Dev" -Force
```

Extrayez ensuite l’archive directement dans `C:\Dev`. Le projet doit se trouver ici :

```text
C:\Dev\campus-lost-found
```

## 2. Initialiser le nouveau dépôt Git

```powershell
Set-Location "C:\Dev\campus-lost-found"
git init
git status
```

Le dossier racine affiché par Git doit être `C:\Dev\campus-lost-found`.

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

## 5. Créer le premier commit

Créez d’abord sur GitHub un dépôt **vide**, sans README, licence ni `.gitignore`, puis exécutez :

```powershell
git add .
git commit -m "Initial release - Campus Lost and Found"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/campus-lost-found.git
git push -u origin main
```

Remplacez `VOTRE-COMPTE` par votre identifiant GitHub.

## Sécurité

Ne versionnez pas les fichiers `.env`. Seuls les modèles `.env.example` sont inclus dans cette archive.

