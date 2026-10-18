# Contribution et stratégie Git

## Branches

- `main` : version démontrable et déployable ;
- `develop` : intégration des fonctionnalités validées ;
- `feature/<sujet>` : une fonctionnalité ou correction isolée.

Exemple :

```bash
git switch develop
git pull --ff-only
git switch -c feature/nom-court
```

## Contrôles avant une pull request

```bash
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend test -- --watch=false
npm.cmd --prefix frontend run build

npm.cmd --prefix backend ci
npm.cmd --prefix backend run lint
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:e2e
npm.cmd --prefix backend run build
```

Le test PostgreSQL réel est expliqué dans `docs/RUNBOOK.md` et est exécuté automatiquement par la CI.

## Pull request

1. Commiter un changement cohérent avec un message explicite.
2. Pousser la branche `feature/*`.
3. Ouvrir une pull request vers `develop`.
4. Attendre la réussite des jobs `frontend` et `backend`.
5. Faire relire puis fusionner.
6. Ouvrir une pull request de `develop` vers `main` pour une livraison.

## Protection GitHub recommandée

Dans **Settings → Rules → Rulesets**, cibler `main` et activer :

- pull request obligatoire ;
- une approbation ;
- résolution des conversations ;
- contrôles de statut `frontend` et `backend` obligatoires ;
- blocage des force-push et suppressions.

La protection doit être activée manuellement par le propriétaire du dépôt. Documentation officielle : <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches>.
