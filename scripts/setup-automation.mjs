import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dockerEnvPath = resolve(projectRoot, 'docker', '.env');
const backendEnvPath = resolve(projectRoot, 'backend', '.env');

const secret = (bytes = 32) => randomBytes(bytes).toString('hex');

function readEnv(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function valueOf(content, key) {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}

function isPlaceholder(value) {
  return !value || value.startsWith('replace-with-');
}

function ensureValues(path, content, entries) {
  let next = content;
  const changed = [];

  for (const [key, value] of Object.entries(entries)) {
    const linePattern = new RegExp(`^${key}=.*$`, 'm');
    const currentValue = valueOf(next, key);

    if (currentValue && !isPlaceholder(currentValue)) {
      continue;
    }

    if (linePattern.test(next)) {
      next = next.replace(linePattern, `${key}=${value}`);
    } else {
      if (next.length && !next.endsWith('\n')) {
        next += '\n';
      }

      next += `${key}=${value}\n`;
    }

    changed.push(key);
  }

  if (changed.length) {
    writeFileSync(path, next, { encoding: 'utf8', mode: 0o600 });
  }

  return changed;
}

if (!existsSync(dockerEnvPath)) {
  console.error('docker/.env is missing. Run "node scripts/setup-local.mjs" first.');
  process.exit(1);
}

const dockerEnv = readEnv(dockerEnvPath);
const currentAutomationKey = valueOf(dockerEnv, 'AUTOMATION_API_KEY');
const currentN8nEncryptionKey = valueOf(dockerEnv, 'N8N_ENCRYPTION_KEY');
const automationKey = isPlaceholder(currentAutomationKey) ? secret(32) : currentAutomationKey;
const n8nEncryptionKey = isPlaceholder(currentN8nEncryptionKey) ? secret(32) : currentN8nEncryptionKey;

const dockerAdded = ensureValues(dockerEnvPath, dockerEnv, {
  APP_HOST: 'localhost',
  AUTOMATION_API_KEY: automationKey,
  N8N_ENCRYPTION_KEY: n8nEncryptionKey,
  N8N_SECURE_COOKIE: 'false',
  N8N_ORIGIN: 'http://localhost:5678',
  N8N_PUBLIC_PORT: '5678',
});

const backendEnv = readEnv(backendEnvPath);
const backendAdded = existsSync(backendEnvPath)
  ? ensureValues(backendEnvPath, backendEnv, { AUTOMATION_API_KEY: `"${automationKey}"` })
  : [];

if (dockerAdded.length || backendAdded.length) {
  console.log('Configuration n8n ajoutée sans modifier les secrets existants.');
  console.log(`docker/.env : ${dockerAdded.join(', ') || 'aucun changement'}`);
  console.log(`backend/.env : ${backendAdded.join(', ') || 'aucun changement'}`);
} else {
  console.log('Configuration n8n déjà présente. Aucun fichier n’a été modifié.');
}

if (!existsSync(backendEnvPath)) {
  console.warn('backend/.env est absent. Ce fichier est uniquement nécessaire pour lancer NestJS hors Docker.');
}
