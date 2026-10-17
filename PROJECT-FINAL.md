# État du projet — version prête à lancer

## Périmètre livré

Le projet forme une application full-stack cohérente et exécutable :

- Angular 22 pour l’interface ;
- NestJS 12 pour l’API REST ;
- Prisma 5 et PostgreSQL 17 pour les données ;
- Nginx comme point d’entrée unique ;
- Docker Compose pour lancer l’ensemble ;
- seed automatique pour l’administrateur et les catégories.

L’automatisation n8n est hors périmètre de cette livraison. Aucune route, table, variable d’environnement ou dépendance n8n n’a été ajoutée. Elle pourra être intégrée ultérieurement sans bloquer l’application actuelle.

## Parcours utilisateur

1. Créer un compte ou se connecter.
2. Rechercher une annonce par texte, type, statut, catégorie ou localisation.
3. Publier un objet perdu ou trouvé, avec photo et position facultative.
4. Envoyer une réclamation avec un message et une preuve privée.
5. Suivre la décision et organiser la restitution.
6. Recevoir les notifications associées.

## Administration

L’espace `/admin` est protégé par le rôle `ADMIN`. Il permet de gérer :

- les annonces et leur statut ;
- les utilisateurs et leurs rôles ;
- les réclamations ;
- les catégories ;
- les localisations.

## Architecture d’exécution

Le navigateur appelle un seul point d’entrée sur le port `8080`. Nginx sert le frontend et transmet les URL `/api/*` au backend. PostgreSQL reste sur un réseau Docker interne. Les photos et les données utilisent des volumes persistants.

| Service | Rôle | Accès externe |
|---|---|---|
| `proxy` | Nginx, point d’entrée | `http://localhost:8080` |
| `frontend` | fichiers Angular compilés | interne |
| `backend` | API NestJS | interne |
| `backend-seed` | initialisation idempotente | aucun, puis s’arrête |
| `postgres` | base PostgreSQL | interne |

## Sécurité et données

- mots de passe utilisateur hachés avec bcrypt ;
- authentification JWT et contrôles de rôles côté API ;
- validation globale des entrées ;
- pièces jointes de réclamation privées ;
- secrets locaux générés aléatoirement et ignorés par Git ;
- exécution des conteneurs applicatifs sans privilèges root ;
- limites de taille et de type sur les fichiers envoyés.

## Validation de la livraison

Contrôles exécutés le 17 octobre 2026 :

- installation reproductible avec `npm ci` pour les deux applications ;
- frontend : 27 fichiers de tests et 30 tests réussis, build de production réussi, audit npm sans vulnérabilité signalée ;
- backend : 48 tests unitaires et 13 tests HTTP réussis, lint et build réussis ;
- audit des dépendances de production backend sans vulnérabilité signalée ;
- schéma Prisma et syntaxe des fichiers Compose validés.

Le moteur Docker n’étant pas disponible dans l’environnement de fabrication de cette archive, le démarrage des conteneurs doit être confirmé sur la machine cible avec `START-WINDOWS.cmd`.

## Suite recommandée

Après validation de cette base, l’étape suivante pourra ajouter n8n comme service indépendant, avec des webhooks authentifiés et des événements idempotents. Les premiers scénarios utiles seraient les notifications de correspondance, les relances de réclamation et un résumé quotidien pour l’administrateur.
