# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

BilleRef: billetera móvil ficticia (tarea final del curso DS-HET-103). Solo hace dos cosas: transferir a otros usuarios y pagar luz, agua e internet, más saldo e historial. Todos los datos son ficticios; no usar datos, sistemas ni código de ningún banco real.

El trabajo está guiado por documentación y todo está escrito en español. Las carpetas numeradas son las etapas del flujo:

| Carpeta | Contenido | Estado |
|---|---|---|
| `01-adr/` | 8 ADR + índice con supuestos S-01..S-08 | Hecho |
| `02-historias/` | 17 historias `HU-HH` con criterios Gherkin `CA-HH.N`, catálogo de códigos de error, supuestos SH-01..SH-06 | Hecho |
| `03-especificaciones/` | Especificación original (`especificaciones-iniciales.md.txt`) y `SPEC-HU-HH-*.md` con reglas `R-HH.N`; el `README.md` tiene el modelo de datos, los DTO y el orden de procesamiento comunes | Hecho |
| `04-plan-de-pruebas/` | `plan-pruebas.md` y `matriz-trazabilidad.md` (casos `TC-HH-NN`) | Hecho |
| `05-desarrollo/` | `plan-desarrollo.md`, `tareas.md` (T-01..T-28 con sus TC) y `bitacora-sesiones.md`; código previsto en `backend/` y `frontend/` | Plan hecho, sin código |
| `06-skills/` | Skills del proyecto: `billeref-testing`, `billeref-convenciones-backend`, `billeref-convenciones-frontend`, `billeref-revision` | Hecho |
| `07-mcp/` | Configuración del MCP de Playwright (`@playwright/mcp@0.0.83`, Chrome 390×844, `America/La_Paz`) y cómo registrarlo | Hecho (registro local en `~/.claude.json`) |
| `08-evidencias/` | Evidencias por caso: `08-evidencias/<TC-ID>/` | Vacío |

La raíz del repositorio git es la carpeta padre (`trabajo-final/`), no `billeref/`.

## Trazabilidad (no romperla)

La cadena es `HU-HH` → `CA-HH.N` → `R-HH.N` → `TC-HH-NN`, con `TC-HH-NN` ↔ `CA-HH.N` uno a uno.

- Toda regla de una SPEC cita al menos un CA (`→ CA-05.3`) y aparece en la tabla de trazabilidad de su SPEC.
- Todo CA de una historia está cubierto por al menos una regla de su SPEC y por una fila de la matriz.
- Al agregar o cambiar un criterio, actualizar en conjunto la historia, su SPEC (regla + tabla), la matriz y, si aparece un código de error nuevo, el catálogo de `02-historias/README.md`.
- Precedencia ante contradicciones: el ADR más específico del tema, luego la SPEC, luego la historia. Si dos documentos chocan, corregirlos, no elegir uno en silencio.

## Forma de trabajar con el usuario

- Antes de decidir algo que la especificación deja ambiguo, preguntar. Las decisiones menores que se tomen sin preguntar se registran como supuestos (S-xx en ADR, SH-xx en historias) y se informan.
- Commits en la rama de trabajo (no directamente en `main`); hacer commit o push solo cuando el usuario lo pida.
- Al construir, tomar la siguiente tarea de `05-desarrollo/tareas.md` según sus dependencias, escribir primero sus casos TC (nombres de prueba con el ID, p. ej. `TC_07_02_…`), y al cerrar la sesión marcar la tarea y agregar una entrada en `05-desarrollo/bitacora-sesiones.md`.

## Automatización de Claude Code en este proyecto

- **Skills** (`.claude/skills/` → uniones a `06-skills/`): `billeref-testing`, `billeref-convenciones-backend`, `billeref-convenciones-frontend`, `billeref-revision`.
- **Subagentes** (`.claude/agents/`):
  - `revisor-seguridad`: audita PIN, logs, URLs, secretos y sesión; solo lee y reporta con severidad.
  - `tester-e2e`: ejecuta casos E2E con Playwright MCP y registra la evidencia en `08-evidencias/`; no corrige código.
- **Hooks** (`.claude/settings.json`, scripts en `.claude/hooks/`):
  - `proteger-secretos.mjs` (PreToolUse): bloquea leer, escribir, buscar o mencionar en comandos `.env`, `.env.*` y `secrets.json` (permite `.env.example`). Además hay reglas `deny` equivalentes. No intentar evitarlo: las variables las configura el usuario con `dotnet user-secrets`.
  - `verificar-cambios.mjs` (PostToolUse, en segundo plano): tras editar código de `05-desarrollo/`, corre ESLint y Jest relacionado (frontend) o `dotnet build -warnaserror` y `dotnet test` (backend). Si falla, el error vuelve al asistente: corregirlo antes de seguir.
- **MCP:** `playwright` (ver `07-mcp/`).

## Stack y comandos previstos (ADR-001, ADR-008, plan §5)

Aún no existe código. Al crearlo, respetar:

- Backend: ASP.NET Core Web API en **.NET 10 LTS** (ADR-009; SDK fijado en `05-desarrollo/backend/global.json`), solución `BilleRef.slnx` con `BilleRef.Api`, `BilleRef.Domain` y `BilleRef.Infrastructure` (semilla JSON en `BilleRef.Infrastructure/Seed/`).
- Frontend: **Angular** (PWA, mobile-first) con `proxy.conf.json` hacia la API, sin CORS.
- Pruebas: xUnit con `Assert` (no FluentAssertions); API con `WebApplicationFactory` y `FakeTimeProvider`; Jest mediante `jest-preset-angular` (no Karma ni el *builder* de Jest de Angular CLI); E2E con el MCP de Playwright en Chromium a 390×844.

Arranque para E2E (PowerShell):
```powershell
cd 05-desarrollo/backend
$env:Servicios__TimeoutSegundos = "2"   # timeout corto de la empresa simulada en E2E
dotnet run --project BilleRef.Api
cd 05-desarrollo/frontend; npm ci; ng serve
```
La clave JWT va en `dotnet user-secrets set "Jwt:Key" "<32+ bytes>"`; sin ella la app no debe arrancar. Endpoints solo para `Development`: `POST /api/test/reset` (restablece todo el estado) y `POST /api/test/empresas/comportamiento` (`NORMAL | LENTO | FALLA`).

## Decisiones de arquitectura que el código debe cumplir

Lo que sigue no se deduce de un solo archivo; está repartido entre los ADR y el README de especificaciones.

- **Persistencia en memoria** (`InMemoryStore` *singleton*) como única fuente de verdad para saldos, operaciones y estado de las deudas. El mock de empresas lee de `IDeudaRepository`; no guarda copia propia.
- **Orden de procesamiento de transferencias y pagos** (`03-especificaciones/README.md`): JWT → `Idempotency-Key` → formato → bloqueo temporal → PIN (fuera del lock; PBKDF2 es lento) → **sección crítica global** (`SemaphoreSlim(1,1)`): idempotencia → reglas de negocio → aplicar todo junto con restauración ante excepción → guardar clave. Sin `await` ni E/S mientras se aplican los cambios.
- **Idempotencia:** clave UUID por entrada a la pantalla de confirmación; solo los éxitos consumen la clave; la huella SHA-256 excluye el PIN; una repetición devuelve `200` con el cuerpo original y `Idempotent-Replayed: true`.
- **Pagos:** el monto sale del repositorio, nunca del cliente. La validación del pago no pasa por el gateway: el timeout de 10 s + 1 reintento (Polly v8, `Polly.Core`) aplica solo a `POST /api/servicios/deudas`.
- **Dinero:** `decimal` en C#; en JSON siempre cadena (`"185.40"`); los montos se rechazan si tienen más de 2 decimales, nunca se redondean; el frontend no calcula montos (total y comisión vienen del backend).
- **Tiempo:** se guarda en UTC; Bolivia es UTC−4 fijo (sin horario de verano); el día del límite diario es el calendario de Bolivia; `TimeProvider` inyectado en todos lados.
- **Sesión:** JWT HS256 de 5 min con `ClockSkew = TimeSpan.Zero`, renovación por la cabecera `X-Renewed-Token` y `POST /api/auth/renovar`, revocación por `sid`; el token vive solo en memoria (recargar la página cierra la sesión).
- **Privacidad:** celular, código de cliente y PIN viajan solo en cuerpos `POST`, nunca en URLs. Logs: `Microsoft.AspNetCore` en `Warning`, sin `UseHttpLogging`, enmascarando con `Mascaras.Celular/Nombre/CodigoCliente`. Cada transferencia guarda el saldo resultante de cada parte; el destinatario nunca ve el saldo del remitente.
- **Errores:** `ProblemDetails` con `codigo`; los códigos y mensajes exactos están en el catálogo de `02-historias/README.md`.
