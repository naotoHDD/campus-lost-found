# Audit final de conformité

Date : 18 octobre 2026  
Référence : cahier des charges TEK-UP « Application et infrastructure locale auto-hébergée »

## Verdict

Le code et les livrables techniques couvrent les phases 1, 2 et 3. La conformité finale reste conditionnée à des preuves qui nécessitent la machine et les comptes de l’équipe : déploiement sur la VM, persistance après redémarrage, exécution GitHub Actions verte et règles de branches actives.

| Domaine                    | État                     | Preuve principale                                             |
| -------------------------- | ------------------------ | ------------------------------------------------------------- |
| Application                | Prêt et testé            | builds, 36 tests frontend, 64 tests backend, 16 tests HTTP    |
| Infrastructure déclarative | Prête                    | Dockerfiles, Compose, réseaux, volumes, Nginx, healthcheck DB |
| VM Linux réelle            | À démontrer physiquement | `docs/VM-DEPLOYMENT.md`                                       |
| Exploitation               | Prête                    | README, runbook, backup/restore, CI                           |
| Git collaboratif           | À activer sur GitHub     | `CONTRIBUTING.md`, modèle de PR                               |
| n8n (bonus)                | Fonctionnel              | workflow de matching et notifications dédupliquées            |

## Exigences fonctionnelles

| ID    | Exigence                          | État     | Éléments vérifiés                                                                                     |
| ----- | --------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| EF-01 | Authentification                  | Conforme | inscription, connexion, déconnexion, bcrypt, JWT, profil public sans hash                             |
| EF-02 | Rôles et autorisations            | Conforme | rôles `USER`/`ADMIN`, guards backend, contrôle du rôle courant en base                                |
| EF-03 | CRUD de trois entités liées       | Conforme | annonces, catégories et localisations ; API et écrans de création, lecture, modification, suppression |
| EF-04 | Recherche, filtres, pagination    | Conforme | texte, type, statut, catégorie, gouvernorat, délégation, tri et pagination                            |
| EF-05 | Dépôt et consultation de fichiers | Conforme | images publiques, preuves privées, validation MIME/taille, volume `uploaded_files`                    |
| EF-06 | Tableau de bord                   | Conforme | compteurs utilisateurs, annonces, réclamations et localisations pour l’admin                          |

## Corrections finales intégrées

### Étape 1 — Fonctionnel

- la question de vérification réelle est affichée au réclamant ;
- le détail secret attendu reste absent des réponses publiques ;
- la réponse à la question est obligatoire côté frontend et backend ;
- les pièces jointes sont validées avant envoi (JPG, PNG, PDF, 5 Mo) ;
- un auteur ne peut pas réclamer sa propre annonce ;
- catégories et localisations disposent maintenant de la modification dans l’interface admin ;
- le lien desktop **Activité** ouvre la route `/notifications` ;
- les décorateurs Swagger des DTO ont été remis sur leurs propriétés correctes.

### Étape 2 — Sécurité et intégration

- code de restitution valable 30 minutes ;
- cinq erreurs maximum, puis statut HTTP 429 ;
- replanification = nouveau code, compteur remis à zéro et confirmations annulées ;
- code effacé après validation, heure de validation conservée ;
- migration Prisma `20261017233000_secure_recovery_codes` ;
- `/api/health` et `/health` vérifient réellement PostgreSQL ;
- healthcheck Docker du backend basé sur cette route ;
- test d’intégration HTTP avec vrai PostgreSQL 17 et garde empêchant l’effacement d’une base non dédiée aux tests ;
- CI avec service PostgreSQL, migrations puis test réel.

## Exigences non fonctionnelles

| Exigence              | État                        | Commentaire                                                                              |
| --------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| Aucun secret dans Git | Conforme côté livraison     | `.env` ignorés, `.env.example` fournis, secrets générés aléatoirement                    |
| Validation backend    | Conforme                    | `ValidationPipe`, DTO et filtres de fichiers                                             |
| Persistance           | Prête à démontrer           | volumes PostgreSQL, uploads et n8n ; test physique après redémarrage requis              |
| Reproductibilité      | Conforme côté configuration | builds multi-étapes et Compose complet                                                   |
| Tests automatisés     | Conforme côté code          | unitaires, HTTP mockés et intégration PostgreSQL réelle en CI                            |
| Base non exposée      | Conforme                    | PostgreSQL uniquement sur le réseau Docker interne en mode complet                       |
| Proxy unique          | Conforme pour l’application | seul Nginx est accessible sur le LAN ; n8n reste lié au loopback comme outil local bonus |

## Résultats automatisés de cette livraison

- frontend : 27 fichiers, 36 tests réussis ;
- frontend : build production réussi ;
- backend : 12 suites, 64 tests unitaires réussis ;
- backend : 1 suite, 16 tests HTTP réussis ;
- backend : lint et build réussis ;
- couverture backend : 66,51 % instructions, 53,76 % branches, 54,83 % fonctions, 66,12 % lignes ;
- Prisma : schéma valide et client régénéré ;
- test PostgreSQL : source type-checkée ; exécution locale non possible dans l’environnement d’audit dépourvu de Docker ;
- dépendances de production : zéro vulnérabilité signalée par `npm audit` pour frontend et backend ;
- scripts d’exploitation : syntaxe Bash valide.

## Actions physiques obligatoires avant la soutenance

1. Reconstruire la livraison sur Windows avec `INSTALLER-LA-VERSION-FINALE.md`, vérifier `/health` et les deux parcours corrigés.
2. Créer/provisionner la VM Ubuntu, déployer, puis prouver l’accès par le proxy et la persistance après `down` / `up -d`.
3. Pousser le code, vérifier les jobs GitHub Actions, créer `develop`, protéger `main` et faire relire une pull request par un autre membre.
4. Créer une sauvegarde, contrôler `SHA256SUMS` et effectuer au moins une restauration sur un environnement de test.

Une fois ces preuves réalisées, le projet satisfait le critère final : application construite, conteneurisée, déployée sur une infrastructure réelle, reproductible, documentée et exploitable.
