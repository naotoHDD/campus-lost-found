# Correctif n8n — accès local sur le port 5678

Ce correctif remplace le montage fragile sous `/n8n/` par un accès local direct à l'éditeur n8n.

## Installation sous Windows

1. Extraire l'archive à la racine de `C:\Users\user\Code\campus-lost-found` en acceptant le remplacement des fichiers.
2. Ne pas supprimer `docker\.env` et ne pas supprimer les volumes Docker.
3. Ouvrir PowerShell dans le projet puis exécuter :

```powershell
docker compose --env-file .\docker\.env -f .\docker\compose.full.yml up -d --force-recreate n8n proxy
```

4. Attendre quelques secondes puis ouvrir :

```powershell
Start-Process "http://localhost:5678/"
```

L'application principale reste accessible à l'adresse définie par `APP_ORIGIN`, actuellement `http://localhost:8090` sur la machine concernée.

Le correctif ne contient pas `docker\.env` et ne modifie donc aucun mot de passe ni secret local.
