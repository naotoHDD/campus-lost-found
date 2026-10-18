# Politique de sécurité

Ne publiez pas une vulnérabilité exploitable, un secret, une preuve privée ou des données personnelles dans une issue publique.

Pour un projet pédagogique privé, transmettre le rapport directement au propriétaire du dépôt. Inclure : composant, version/commit, préconditions, impact, reproduction minimale et correction proposée.

Les fichiers `docker/.env` et `backend/.env`, sauvegardes, pièces jointes et exports PostgreSQL ne doivent jamais être commités. En cas de fuite : retirer l’accès au fichier, renouveler les secrets concernés et invalider les anciennes sessions en changeant `JWT_SECRET`.

Le déploiement fourni est adapté à une machine locale ou une VM de démonstration. Une exposition Internet exige au minimum TLS, filtrage réseau adapté à Docker, supervision, sauvegardes distantes chiffrées et procédure de mise à jour régulière.
