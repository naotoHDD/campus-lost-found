#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "${script_dir}/.." && pwd)"
env_file="${project_root}/docker/.env"
compose_file="${project_root}/docker/compose.full.yml"
backup_root="${1:-${project_root}/backups}"

if [[ ! -f "${env_file}" ]]; then
  echo "Erreur : ${env_file} est introuvable. Configurez d'abord le projet." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${env_file}"
set +a

: "${POSTGRES_USER:?POSTGRES_USER manque dans docker/.env}"
: "${POSTGRES_DB:?POSTGRES_DB manque dans docker/.env}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="${backup_root%/}/${timestamp}"
mkdir -p -- "${backup_dir}"
trap 'rm -rf -- "${backup_dir}"' ERR

compose=(docker compose --project-directory "${project_root}" --env-file "${env_file}" -f "${compose_file}")

echo "Sauvegarde PostgreSQL…"
"${compose[@]}" exec -T postgres \
  pg_dump --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" --format custom \
  > "${backup_dir}/postgres.dump"

echo "Sauvegarde des fichiers envoyés…"
"${compose[@]}" exec -T backend \
  sh -c 'tar -C /app/uploads -czf - .' \
  > "${backup_dir}/uploads.tar.gz"

echo "Sauvegarde de la configuration n8n…"
"${compose[@]}" exec -T n8n \
  sh -c 'tar -C /home/node/.n8n -czf - .' \
  > "${backup_dir}/n8n.tar.gz"

(
  cd -- "${backup_dir}"
  sha256sum postgres.dump uploads.tar.gz n8n.tar.gz > SHA256SUMS
)

{
  echo "created_at_utc=${timestamp}"
  echo "postgres_database=${POSTGRES_DB}"
  echo "project=campus-lost-found"
} > "${backup_dir}/metadata.txt"

trap - ERR
echo "Sauvegarde terminée : ${backup_dir}"
echo "Conservez aussi docker/.env dans un coffre-fort séparé : il contient les clés nécessaires à n8n."
