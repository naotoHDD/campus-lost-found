# État du projet — version prête à lancer

## Périmètre livré

Le projet forme une application full-stack cohérente et exécutable :

- Angular 22 pour l’interface ;
- NestJS 12 pour l’API REST ;
- Prisma 5 et PostgreSQL 17 pour les données ;
- Nginx comme point d’entrée unique ;
- Docker Compose pour lancer l’ensemble ;
- n8n comme orchestrateur du matching automatique ;
- seed automatique pour l’administrateur et les catégories.

L’automatisation n8n reste un bonus par rapport au cahier des charges principal. Elle est isolée du cœur métier : n8n déclenche le traitement, tandis que NestJS calcule le score, applique les règles de sécurité et crée les notifications dédupliquées.

## Parcours utilisateur

1. Créer un compte ou se connecter.
2. Rechercher une annonce par texte, type, statut, catégorie ou localisation.
3. Publier un objet perdu ou trouvé, avec photo et position facultative.
4. Envoyer une réclamation avec un message et une preuve privée.
5. Consulter les réclamations reçues, vérifier les preuves et accepter ou refuser.
6. Organiser la restitution avec un code privé temporaire, cinq tentatives maximum et une confirmation de chaque participant.
7. Recevoir les notifications associées.

## Administration

L’espace `/admin` est protégé par le rôle `ADMIN`. Il permet de gérer :

- les annonces et leur statut ;
- les utilisateurs et leurs rôles ;
- les réclamations ;
- les catégories, avec renommage ;
- les localisations, avec modification complète.

## Architecture d’exécution

Le navigateur appelle l’application via le port défini par `APP_PORT` (8080 par défaut). Nginx sert le frontend et transmet les URL `/api/*` au backend. PostgreSQL reste sur un réseau Docker interne. L’éditeur n8n possède un accès local séparé, limité à `127.0.0.1` sur le port défini par `N8N_PUBLIC_PORT` (5678 par défaut). Les photos, les données et la configuration n8n utilisent des volumes persistants.

| Service        | Rôle                                   | Accès externe                      |
| -------------- | -------------------------------------- | ---------------------------------- |
| `proxy`        | Nginx, point d’entrée de l’application | `APP_ORIGIN`                       |
| `frontend`     | fichiers Angular compilés              | interne                            |
| `backend`      | API NestJS                             | interne                            |
| `backend-seed` | initialisation idempotente             | aucun, puis s’arrête               |
| `postgres`     | base PostgreSQL                        | interne                            |
| `n8n`          | orchestration du matching              | local uniquement, via `N8N_ORIGIN` |

## Sécurité et données

- mots de passe utilisateur hachés avec bcrypt ;
- authentification JWT et contrôles de rôles côté API ;
- validation globale des entrées ;
- pièces jointes de réclamation privées ;
- code de restitution visible uniquement par le propriétaire physique et vérifiable uniquement par le détenteur ;
- expiration du code après 30 minutes, verrouillage après cinq erreurs et suppression du code après validation ;
- double confirmation limitée au rôle réel de chaque participant ;
- secrets locaux générés aléatoirement et ignorés par Git ;
- exécution des conteneurs applicatifs sans privilèges root ;
- limites de taille et de type sur les fichiers envoyés ;
- route d’automatisation protégée par une clé générée localement ;
- clé de chiffrement n8n et notifications dédupliquées.

## Validation de la livraison

Contrôles exécutés le 18 octobre 2026 :

- installation reproductible avec `npm ci` pour les deux applications ;
- frontend : 27 fichiers de tests et 36 tests réussis, build de production réussi ;
- backend : 64 tests unitaires et 16 tests HTTP réussis, lint et build réussis ;
- couverture backend : 66,51 % des instructions et 53,76 % des branches ;
- audits npm de production frontend et backend : aucune vulnérabilité signalée ;
- schéma Prisma validé et test d’intégration PostgreSQL type-checké ;
- scripts de sauvegarde et restauration validés par `bash -n`.

Le lancement Docker de la version précédente a été confirmé sur la machine Windows cible : PostgreSQL, backend, frontend, proxy et n8n démarrent, le workflow publié obtient une correspondance à 100/100 sur le scénario de validation et les deux participants reçoivent leur notification. La présente version ajoute une migration, un healthcheck PostgreSQL et le test d’intégration réel : elle doit être reconstruite sur cette machine ou par GitHub Actions pour constituer la preuve finale.

Le rapport détaillé et les deux actions physiques restantes se trouvent dans [`docs/AUDIT-FINAL.md`](docs/AUDIT-FINAL.md).

## Automatisation livrée

Le workflow **Lost & Found - Automatic item matching** traite les nouvelles annonces toutes les dix minutes. Il compare la catégorie, le gouvernorat, la délégation, la date et le texte. À partir de 60/100, il crée une notification pour chaque utilisateur concerné, sans accepter la réclamation ni exposer les preuves privées.

Les extensions prévues après validation de ce premier workflow sont les relances de réclamation, les rappels de rendez-vous et le résumé quotidien destiné à l’administrateur.
