# Installation du correctif Réclamations et restitution

Ce correctif ajoute la boîte des réclamations reçues et connecte entièrement l’écran de restitution à l’API. Il ne contient aucun fichier `.env`, ne modifie pas le schéma de la base et ne supprime aucun volume Docker.

## 1. Copier les fichiers

Extraire l’archive dans :

```text
C:\Users\user\Code\campus-lost-found
```

Accepter le remplacement des fichiers existants. L’archive conserve déjà les dossiers `backend/` et `frontend/` : ne pas créer un niveau `campus-lost-found` supplémentaire.

## 2. Reconstruire les services modifiés

Dans PowerShell, exécuter les commandes une par une :

```powershell
Set-Location "C:\Users\user\Code\campus-lost-found"
docker compose --env-file .\docker\.env -f .\docker\compose.full.yml up -d --build backend frontend proxy
docker compose --env-file .\docker\.env -f .\docker\compose.full.yml ps
```

Ouvrir ensuite l’adresse `APP_ORIGIN` de `docker\.env`. Sur la configuration actuelle, il s’agit de :

```text
http://localhost:8090
```

## 3. Tester le parcours complet

1. Avec le compte qui n’a pas publié l’annonce, ouvrir une annonce compatible et cliquer sur **Réclamer cet objet**.
2. Saisir une preuve que seul le véritable propriétaire ou détenteur peut connaître, répondre à la question de vérification et envoyer la réclamation.
3. Se connecter avec l’auteur de l’annonce, ouvrir **Mes réclamations**, puis la section **Réclamations reçues**.
4. Examiner le message, la réponse et l’éventuelle pièce jointe privée, puis cliquer sur **Accepter**.
5. Cliquer sur **Organiser la remise**, choisir le lieu, la date et l’heure, puis enregistrer.
6. Le propriétaire physique de l’objet consulte le code à six chiffres. Le détenteur physique saisit ce code lors de la remise.
7. Chaque participant confirme ensuite uniquement son propre rôle. Lorsque les deux confirmations sont présentes, la réclamation passe à `COMPLETED` et l’annonce à `RETURNED`.

Si une réclamation existe déjà entre ces deux comptes pour la même annonce, utiliser une autre paire d’annonces ou de comptes afin d’éviter le contrôle anti-doublon.

## 4. En cas de problème

Afficher les journaux récents :

```powershell
docker compose --env-file .\docker\.env -f .\docker\compose.full.yml logs --no-color --tail=120 backend frontend proxy
```

Ne pas exécuter `docker compose down -v` : l’option `-v` supprimerait les données locales.
