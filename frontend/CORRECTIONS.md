# Campus Lost & Found — Frontend corrigé

Corrections principales :
- structure Angular nettoyée ;
- `item.model.ts` remis en TypeScript ;
- `app.config.ts` corrigé ;
- guards et interceptor corrigés ;
- `Header` et `Button` corrigés ;
- `ItemCreate` et `CreateClaim` reconstruits ;
- services Auth / Item / Claim / Recovery corrigés ;
- tests de services corrigés ;
- SSR retiré de la configuration de build afin de garder une SPA Angular classique ;
- compilation Angular TypeScript + templates validée avec `ngc` pour l'application et les specs.

## Lancer le projet

```bash
npm install
npm start
```

Puis ouvrir : http://localhost:4200

Les pages authentifiées et les données affichées nécessitent le backend NestJS et sa base PostgreSQL. Démarrez le backend depuis `backend/` avant de les utiliser.
