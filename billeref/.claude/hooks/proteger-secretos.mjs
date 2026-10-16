// Hook PreToolUse: bloquea leer, escribir o buscar archivos de secretos (.env y secrets.json de user-secrets).
// ADR-003 / ADR-007: nada de secretos en el repositorio ni en el contexto del asistente.
// Se permiten las plantillas sin valores reales: .env.example, .env.sample, .env.template.

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const PLANTILLAS = /^\.env\.(example|sample|template)$/i;

function esArchivoSecreto(ruta) {
  if (!ruta) return false;
  const nombre = basename(String(ruta).replace(/\\/g, '/'));
  if (PLANTILLAS.test(nombre)) return false;
  return /^\.env(\..+)?$/i.test(nombre) || /^secrets\.json$/i.test(nombre);
}

// Busca menciones a .env / .env.* / secrets.json dentro de un comando o patrón de búsqueda.
function mencionaSecreto(texto) {
  if (!texto) return false;
  const candidatos = String(texto).match(/[^\s'"`|&;<>()]*(\.env(\.[\w.-]+)?|secrets\.json)(?=$|[\s'"`|&;<>)])/gi) || [];
  return candidatos.some((c) => esArchivoSecreto(c));
}

// Patrón glob de archivos (Glob.pattern, Grep.glob) que puede abarcar un archivo de secretos: ".env", ".env*", "**/.env.{local,prod}"…
function globAbarcaSecreto(glob) {
  if (!glob) return false;
  const ultimo = String(glob).replace(/\\/g, '/').split('/').pop();
  if (PLANTILLAS.test(ultimo)) return false;
  return /^\.env([.*{[].*)?$/i.test(ultimo) || /^secrets\.(json|\*)$/i.test(ultimo);
}

let entrada;
try {
  entrada = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // sin entrada válida no se decide nada
}

const herramienta = entrada.tool_name || '';
const i = entrada.tool_input || {};
let motivo = null;

if (['Read', 'Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(herramienta)) {
  if (esArchivoSecreto(i.file_path || i.notebook_path)) motivo = `acceso a ${basename(String(i.file_path || i.notebook_path))}`;
} else if (herramienta === 'Grep') {
  // Grep.pattern es el texto buscado, no un archivo: solo se revisan la ruta y el filtro de archivos.
  if (esArchivoSecreto(i.path) || globAbarcaSecreto(i.glob)) motivo = 'búsqueda dentro de archivos de secretos';
} else if (herramienta === 'Glob') {
  if (esArchivoSecreto(i.path) || globAbarcaSecreto(i.pattern)) motivo = 'búsqueda de archivos de secretos';
} else if (['Bash', 'PowerShell'].includes(herramienta)) {
  if (mencionaSecreto(i.command)) motivo = 'comando que menciona un archivo de secretos';
}

if (motivo) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `Bloqueado por el hook de BilleRef (${motivo}). Los archivos .env y secrets.json no se leen ni se escriben desde el asistente ` +
        '(ADR-003, ADR-007). Si necesitas una variable, pide al usuario que la configure con `dotnet user-secrets` o como variable de entorno; ' +
        'para documentar variables usa .env.example sin valores reales.',
    },
  }));
}
process.exit(0);
