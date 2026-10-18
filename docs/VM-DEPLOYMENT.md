# Déploiement sur une VM Ubuntu Server

Cette procédure cible une VM de démonstration sur le réseau local, pas une exposition directe sur Internet.

## 1. Créer la VM

Configuration recommandée :

- Ubuntu Server 24.04 LTS 64 bits ;
- 2 vCPU ;
- 4 Go de RAM ;
- 25 Go de disque dynamique ;
- réseau NAT pour un test depuis le PC hôte, ou pont/bridged pour tester depuis un téléphone ou une tablette du même LAN.

Pendant l’installation, activer OpenSSH et créer un utilisateur non-root. Relever ensuite l’adresse IP :

```bash
hostname -I
```

## 2. Mettre à jour et protéger l’accès SSH

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y ca-certificates curl git openssh-server ufw
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status verbose
```

Autoriser le port de démonstration seulement si la VM doit être ouverte sur le LAN :

```bash
sudo ufw allow 8080/tcp
```

Docker avertit que ses ports publiés peuvent contourner certaines règles UFW. Pour une soutenance, privilégier un réseau NAT/host-only ou un filtrage en amont par l’hyperviseur/routeur. Ne pas exposer cette configuration directement sur Internet.

Référence Ubuntu : <https://documentation.ubuntu.com/server/how-to/security/firewalls/index.html>

## 3. Installer Docker depuis le dépôt officiel

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Fermer puis rouvrir la session SSH afin d’appliquer le groupe `docker`, puis vérifier :

```bash
docker version
docker compose version
docker run --rm hello-world
```

Référence Docker maintenue : <https://docs.docker.com/engine/install/ubuntu/>

## 4. Copier le projet

Avec Git :

```bash
git clone https://github.com/VOTRE-COMPTE/campus-lost-found.git
cd campus-lost-found
```

Pour un dépôt privé, utiliser une clé SSH GitHub ou transférer l’archive avec `scp`; ne pas placer de jeton GitHub dans une commande conservée par l’historique du terminal.

## 5. Générer les secrets

Le script peut être exécuté sans installer Node.js sur la VM :

```bash
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --volume "$PWD:/workspace" \
  --workdir /workspace \
  node:22-bookworm-slim \
  node scripts/setup-local.mjs
```

Éditer ensuite `docker/.env` :

```dotenv
APP_BIND_ADDRESS=0.0.0.0
APP_HOST=192.168.1.50
APP_ORIGIN=http://192.168.1.50:8080
APP_PORT=8080
```

Remplacer `192.168.1.50` par l’adresse réelle de la VM. Ne modifier ni les clés aléatoires générées ni les identifiants PostgreSQL après la première initialisation.

## 6. Construire et démarrer

```bash
docker compose --env-file docker/.env -f docker/compose.full.yml up --build -d
docker compose --env-file docker/.env -f docker/compose.full.yml ps -a
curl --fail http://127.0.0.1:8080/health
```

Depuis un téléphone connecté au même réseau, ouvrir `http://ADRESSE_VM:8080`. Vérifier l’accueil, la recherche, la publication, une réclamation et l’affichage responsive.

## 7. Administrer n8n sans l’exposer

n8n reste lié à `127.0.0.1` dans la VM. Depuis le PC hôte :

```bash
ssh -L 5678:127.0.0.1:5678 UTILISATEUR@ADRESSE_VM
```

Garder cette session ouverte puis utiliser <http://localhost:5678>. Importer et publier le workflow comme décrit dans `n8n/README.md`.

## 8. Preuves de validation à conserver

- capture de `docker compose ... ps -a` avec services sains ;
- réponse JSON de `/health` ;
- application affichée depuis un téléphone ou une tablette ;
- publication et réclamation enregistrées ;
- redémarrage `down` puis `up -d` démontrant la persistance ;
- sauvegarde créée par `./scripts/backup.sh` ;
- exécution GitHub Actions verte sur `main`.

## 9. Arrêt sûr

```bash
docker compose --env-file docker/.env -f docker/compose.full.yml down
```

Ne pas ajouter `-v` : cela supprimerait la base, les fichiers envoyés et les données n8n.
