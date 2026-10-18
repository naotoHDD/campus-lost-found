# Installation du lot n8n — étape 1

Ce lot ajoute le matching automatique sécurisé sans supprimer la base PostgreSQL, les images ou les secrets existants.

## 1. Arrêter temporairement la stack

Depuis la racine du projet :

```powershell
Set-Location "C:\Users\user\Code\campus-lost-found"
.\STOP-WINDOWS.cmd
```

Ne pas utiliser `docker compose down -v` : l’option `-v` supprimerait les données persistantes.

## 2. Copier les fichiers du lot

Extraire le contenu de l’archive directement dans :

```text
C:\Users\user\Code\campus-lost-found
```

Accepter le remplacement des fichiers portant le même nom. L’archive ne contient ni `.env`, ni base de données, ni `node_modules`.

## 3. Relancer le projet

```powershell
Set-Location "C:\Users\user\Code\campus-lost-found"
.\START-WINDOWS.cmd
```

Le script ajoute automatiquement `AUTOMATION_API_KEY` et `N8N_ENCRYPTION_KEY` dans les fichiers locaux lorsqu’elles sont absentes. Les mots de passe PostgreSQL, JWT et administrateur déjà présents ne sont pas remplacés.

## 4. Initialiser n8n

1. Relever `APP_ORIGIN` dans `docker\.env`. Avec la configuration actuelle, l’adresse peut par exemple être `http://localhost:8081`.
2. Ouvrir `APP_ORIGIN/n8n/` dans le navigateur.
3. Créer le compte propriétaire local n8n.
4. Lancer :

```powershell
.\IMPORT-N8N-WINDOWS.cmd
```

5. Rouvrir n8n et sélectionner **Lost & Found - Automatic item matching**.
6. Cliquer sur **Publish**.

## 5. Tester le workflow

1. Créer une annonce perdue avec un premier utilisateur.
2. Créer une annonce trouvée avec un autre utilisateur, en utilisant une catégorie, une localisation, une date et une description proches.
3. Dans n8n, ouvrir le workflow puis exécuter **Manual test**.
4. Vérifier que l’exécution retourne `processedItems` et `matchCount`.
5. Revenir dans l’application et consulter les notifications des deux utilisateurs.

L’automatisation exclut les annonces appartenant au même utilisateur et ne valide aucune réclamation automatiquement.

## 6. Enregistrer le travail dans Git

Après validation :

```powershell
git status
git add .
git commit -m "feat: add secure n8n item matching automation"
git push
```
