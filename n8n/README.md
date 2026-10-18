# Automatisation n8n — matching des annonces

Ce workflow analyse les nouvelles annonces actives toutes les dix minutes. Il appelle une route interne NestJS protégée, compare les objets `LOST` et `FOUND`, puis crée des notifications dédupliquées lorsqu'un score atteint le seuil configuré.

## Première activation sous Windows

1. Lancer `START-WINDOWS.cmd` et attendre que les conteneurs soient prêts.
2. Ouvrir l'adresse n8n affichée par le script, généralement `http://localhost:5678/`.
3. Créer le compte propriétaire local n8n. Ces identifiants restent dans le volume Docker `n8n_data`.
4. Fermer l'onglet, puis lancer `IMPORT-N8N-WINDOWS.cmd` une seule fois.
5. Rouvrir n8n, sélectionner **Lost & Found - Automatic item matching**, puis cliquer sur **Publish**.

Le déclencheur **Manual test** permet d'exécuter immédiatement le workflow. Le déclencheur planifié l'exécute ensuite toutes les dix minutes.

## Commande d'import équivalente

```powershell
docker compose --env-file docker/.env -f docker/compose.full.yml exec -T n8n n8n import:workflow --input=/workflows/item-matching.json
docker compose --env-file docker/.env -f docker/compose.full.yml restart n8n
```

## Sécurité et fiabilité

- `AUTOMATION_API_KEY` est générée localement et partagée uniquement entre le backend et n8n.
- La route `POST /api/automation/matches/run` rejette les appels sans clé valide.
- n8n et le backend communiquent sur le réseau Docker privé.
- L'éditeur n8n est publié uniquement sur `127.0.0.1`, donc il reste accessible depuis le PC local et non depuis le réseau.
- `N8N_ENCRYPTION_KEY` protège les identifiants enregistrés par n8n.
- Le volume `n8n_data` conserve le compte, les workflows et les exécutions après redémarrage.
- Les notifications utilisent une clé de déduplication pour empêcher les doublons.
- L'automatisation ne valide jamais une réclamation et ne lit aucune preuve privée.

## Score de correspondance

- même catégorie : 35 points ;
- même gouvernorat : 20 points ;
- même délégation : 15 points ;
- proximité de la date : jusqu'à 15 points ;
- similarité du titre et de la description : jusqu'à 15 points.

Le workflow utilise un seuil de 60/100. Une annonce modifiée sur un champ utilisé pour le matching est automatiquement rendue éligible à une nouvelle analyse.
