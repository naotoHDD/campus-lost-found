import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dockerEnvPath = resolve(projectRoot, 'docker', '.env');
const backendEnvPath = resolve(projectRoot, 'backend', '.env');
const force = process.argv.includes('--force');

if (!force && (existsSync(dockerEnvPath) || existsSync(backendEnvPath))) {
  console.error('Configuration already exists. Nothing was overwritten.');
  console.error('Use "node scripts/setup-local.mjs --force" only if you intentionally want new local secrets.');
  process.exit(1);
}

const secret = (bytes = 24) => randomBytes(bytes).toString('hex');
const databasePassword = secret(18);
const jwtSecret = secret(48);
const adminEmail = 'admin@tunisia.tn';
const adminPassword = `Admin-${secret(10)}`;

const dockerEnv = `POSTGRES_DB=lost_found
POSTGRES_USER=lost_found_app
POSTGRES_PASSWORD=${databasePassword}
POSTGRES_PORT=5432
APP_ORIGIN=http://localhost:8080
APP_PORT=8080
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=${adminEmail}
ADMIN_PASSWORD=${adminPassword}
ADMIN_NAME=Administrateur
`;

const backendEnv = `DATABASE_URL="postgresql://lost_found_app:${databasePassword}@localhost:5432/lost_found?schema=public"
JWT_SECRET="${jwtSecret}"
JWT_EXPIRES_IN="7d"
PORT=3000
UPLOAD_DIR="./uploads"
CORS_ORIGIN="http://localhost:4200,http://localhost:8080"
ADMIN_EMAIL="${adminEmail}"
ADMIN_PASSWORD="${adminPassword}"
ADMIN_NAME="Administrateur"
`;

mkdirSync(dirname(dockerEnvPath), { recursive: true });
mkdirSync(dirname(backendEnvPath), { recursive: true });
writeFileSync(dockerEnvPath, dockerEnv, { encoding: 'utf8', mode: 0o600 });
writeFileSync(backendEnvPath, backendEnv, { encoding: 'utf8', mode: 0o600 });

console.log('Local configuration created successfully.');
console.log(`Administrator email: ${adminEmail}`);
console.log(`Administrator password: ${adminPassword}`);
console.log('These values are stored in docker/.env and backend/.env. Do not commit them.');
