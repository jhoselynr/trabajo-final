// Hook PostToolUse (Edit|Write|MultiEdit): después de editar código, ejecuta las verificaciones del lado afectado.
//  - Frontend (05-desarrollo/frontend, .ts/.html/.scss): ESLint del archivo y Jest de las pruebas relacionadas.
//  - Backend (05-desarrollo/backend, .cs/.csproj): dotnet build sin advertencias y dotnet test.
// Corre en segundo plano (asyncRewake): si algo falla sale con código 2 y el error vuelve al asistente.
// Si el proyecto todavía no existe, no hace nada.

import { readFileSync, existsSync, writeFileSync, unlinkSync, statSync } from 'node:fs';
import { join, relative, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

let entrada;
try {
  entrada = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const raiz = resolve(process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd());
const archivo = entrada.tool_input?.file_path || entrada.tool_response?.filePath;
if (!archivo) process.exit(0);

const rel = relative(raiz, resolve(archivo)).replace(/\\/g, '/');
const ext = extname(rel).toLowerCase();
const front = join(raiz, '05-desarrollo', 'frontend');
const back = join(raiz, '05-desarrollo', 'backend');

let lado = null;
if (rel.startsWith('05-desarrollo/frontend/') && ['.ts', '.html', '.scss', '.css'].includes(ext) && !rel.includes('/node_modules/')) lado = 'frontend';
if (rel.startsWith('05-desarrollo/backend/') && ['.cs', '.csproj', '.props'].includes(ext) && !/\/(bin|obj)\//.test(rel)) lado = 'backend';
if (!lado) process.exit(0);

// Evita ejecuciones superpuestas del mismo lado (varias ediciones seguidas): la segunda se omite.
const candado = join(tmpdir(), `billeref-hook-${lado}.lock`);
if (existsSync(candado) && Date.now() - statSync(candado).mtimeMs < 10 * 60_000) process.exit(0);
writeFileSync(candado, String(process.pid));

const fallas = [];
function ejecutar(titulo, comando, args, cwd) {
  const r = spawnSync(comando, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32', timeout: 15 * 60_000 });
  if (r.status !== 0) {
    const salida = `${r.stdout || ''}\n${r.stderr || ''}`.trim().split('\n').slice(-40).join('\n');
    fallas.push(`### ${titulo} (código ${r.status ?? 'sin código'})\n${salida}`);
  }
}

try {
  if (lado === 'frontend' && existsSync(join(front, 'package.json'))) {
    const relFront = relative(front, resolve(archivo));
    const hayEslint = ['eslint.config.js', 'eslint.config.mjs', '.eslintrc.json'].some((f) => existsSync(join(front, f)));
    if (hayEslint && ext === '.ts') ejecutar(`ESLint ${relFront}`, 'npx', ['eslint', relFront], front);
    const hayJest = ['jest.config.ts', 'jest.config.js', 'jest.config.mjs'].some((f) => existsSync(join(front, f)));
    if (hayJest && ['.ts', '.html'].includes(ext)) {
      ejecutar(`Jest (pruebas relacionadas con ${relFront})`, 'npx', ['jest', '--findRelatedTests', relFront, '--passWithNoTests'], front);
    }
  }

  // El SDK de .NET 10 crea BilleRef.slnx por defecto; se acepta también el formato clásico .sln.
  const solucion = ['BilleRef.sln', 'BilleRef.slnx'].find((s) => existsSync(join(back, s)));
  if (lado === 'backend' && solucion) {
    ejecutar('dotnet build', 'dotnet', ['build', solucion, '-nologo', '-v', 'q', '-warnaserror'], back);
    if (fallas.length === 0) ejecutar('dotnet test', 'dotnet', ['test', solucion, '--no-build', '-nologo', '-v', 'q'], back);
  }
} finally {
  try { unlinkSync(candado); } catch { /* ya no existe */ }
}

if (fallas.length > 0) {
  process.stderr.write(
    `Verificación automática de BilleRef falló después de editar ${rel}.\n` +
    'Corrige antes de seguir (skill billeref-testing; las convenciones exigen build sin advertencias y pruebas en verde).\n\n' +
    fallas.join('\n\n') + '\n',
  );
  process.exit(2);
}
process.exit(0);
