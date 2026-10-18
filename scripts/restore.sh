#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "${script_dir}/.." && pwd)"
env_file="${project_root}/docker/.env"
compose_file="${project_root}/docker/compose.full.yml"

if [[ $# -ne 2 || "$2" != "--confirm" ]]; then
  echo "Usage : $0 CHEMIN_SAUVEGARDE --confirm" >&2
  echo "Attention : cette opération remplace la base, les fichiers envoyés et les données n8n actuels." >&2
  exit 2
fi

backup_dir="$(cd -- "$1" 2>/dev/null && pwd)" || {
  echo "Erreur : le dossier de sauvegarde est introuvable." >&2
  exit 1
}

for required_file in postgres.dump uploads.tar.gz n8n.tar.gz SHA256SUMS; do
  if [[ ! -f "${backup_dir}/${required_file}" ]]; then
    echo "Erreur : ${required_file} manque dans ${backup_dir}." >&2
    exit 1
  fi
done

if [[ ! -f "${env_file}" ]]; then
  echo "Erreur : ${env_file} est introuvable." >&2
  exit 1
fi

(
  cd -- "${backup_dir}"
  sha256sum --check SHA256SUMS
)

set -a
# shellcheck disable=SC1090
source "${env_file}"
set +a

: "${POSTGRES_USER:?POSTGRES_USER manque dans docker/.env}"
: "${POSTGRES_DB:?POSTGRES_DB manque dans docker/.env}"

compose=(docker compose --project-directory "${project_root}" --env-file "${env_file}" -f "${compose_file}")

echo "Arrêt des services qui écrivent des données…"
"${compose[@]}" stop backend n8n

echo "Restauration PostgreSQL…"
"${compose[@]}" exec -T postgres \
  pg_restore --clean --if-exists --no-owner --no-privileges \
    --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" \
  < "${backup_dir}/postgres.dump"

echo "Restauration des fichiers envoyés…"
"${compose[@]}" run --rm --no-deps -T backend \
  sh -c 'cd /app/uploads && rm -rf -- ./* ./.[!.]* ./..?* && tar -xzf -' \
  < "${backup_dir}/uploads.tar.gz"

echo "Restauration de n8n…"
"${compose[@]}" run --rm --no-deps -T n8n \
  sh -c 'cd /home/node/.n8n && rm -rf -- ./* ./.[!.]* ./..?* && tar -xzf -' \
  < "${backup_dir}/n8n.tar.gz"

echo "Redémarrage et contrôle de santé…"
"${compose[@]}" up -d
"${compose[@]}" ps

echo "Restauration terminée. Vérifiez /health puis connectez-vous à l'application et à n8n."
