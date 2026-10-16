# Bitácora de sesiones · BilleRef

Registro de cada sesión de trabajo con el asistente (Claude Code): qué se pidió, qué se produjo, qué se decidió y qué quedó pendiente. Las entradas van de la más antigua a la más reciente; se agrega una al cerrar cada sesión.

- **Plan:** [plan-desarrollo.md](plan-desarrollo.md) · **Tareas:** [tareas.md](tareas.md)

## Plantilla

```markdown
### Sesión NN · AAAA-MM-DD · <tema>
- **Objetivo:**
- **Tareas:** T-xx
- **Entradas:** documentos o archivos usados
- **Resultado:** qué se produjo (archivos, pruebas en verde, evidencias)
- **Decisiones:** qué se decidió y quién (usuario / asistente); supuestos nuevos
- **Problemas:** errores, bloqueos y cómo se resolvieron
- **Pendientes:**
- **Commit:** hash · rama
```

## Resumen

| Sesión | Fecha | Tema | Commit |
|---|---|---|---|
| 01 | 2026-10-15 | ADR iniciales | `aed6a3c` |
| 02 | 2026-10-15 | Revisión de consistencia de los ADR | `441909e` |
| 03 | 2026-10-15 | Historias de usuario | `562df44` |
| 04 | 2026-10-15 | Especificaciones detalladas | `562df44` |
| 05 | 2026-10-15 | Plan de pruebas y matriz de trazabilidad | `562df44` |
| 06 | 2026-10-15 | `CLAUDE.md` | sin commit |
| 07 | 2026-10-15 | Plan de desarrollo, tareas y bitácora | sin commit |
| 08 | 2026-10-15 | Skills del proyecto | sin commit |
| 09 | 2026-10-15 | Activación de skills y MCP de Playwright | sin commit |
| 10 | 2026-10-15 | Subagentes y hooks | sin commit |
| 11 | 2026-10-15 | Cambio a .NET 10 (ADR-009) | ver commit |

---

### Sesión 01 · 2026-10-15 · ADR iniciales
- **Objetivo:** generar los ADR a partir de `especificaciones-iniciales.md.txt`, preguntando antes de resolver lo ambiguo.
- **Entradas:** `03-especificaciones/especificaciones-iniciales.md.txt`.
- **Resultado:** `01-adr/README.md` y ADR-001 a ADR-008 (stack, persistencia, autenticación, idempotencia, montos y fechas, empresas simuladas, logs, pruebas).
- **Decisiones (usuario):** Angular + .NET 8 Web API; persistencia en memoria con semilla JSON; un ADR por decisión; `Idempotency-Key` para el doble débito; límite diario por día calendario de Bolivia; timeout de 10 s con 1 reintento; usuario bloqueado ve el bloqueo solo con PIN correcto; destinatario bloqueado no recibe; JWT corto con renovación; contador de PIN compartido entre login y confirmación; xUnit + Jest + Playwright MCP. Confirmado después: recargar la página cierra la sesión; máximo diario de Bs 10.000 inclusivo.
- **Decisiones (asistente, supuestos S-01 a S-08):** formato del número de operación, enmascaramiento del nombre, mensaje único para destinatario no disponible, límites inclusivos, comisión fuera del límite diario, glosa recortada, notificaciones en el log.
- **Problemas:** .NET 8 termina su soporte en noviembre de 2026; queda como riesgo en ADR-001.
- **Commit:** `aed6a3c` · `docs/adr-iniciales` (rama creada para no trabajar en `main`).

### Sesión 02 · 2026-10-15 · Revisión de consistencia de los ADR
- **Objetivo:** asegurar que ningún ADR contradiga a otro, porque se usarán para generar código.
- **Resultado:** 8 contradicciones corregidas: el pago revalidaba la deuda por el gateway con timeout dentro del lock; el destinatario veía el saldo del remitente; la inactividad se medía distinto en cliente y servidor; celulares y códigos en URLs (quedaban en logs); el PIN se podía deducir de la huella de idempotencia; un estado "en proceso" imposible y errores que consumían la clave; el JWT sin id interno en la semilla; `Microsoft.Extensions.Http.Resilience` sin `HttpClient`. También se completaron el formato de error, el orden de procesamiento, los tipos del historial y los permisos del comprobante; FluentAssertions se reemplazó por `Assert` de xUnit por su licencia comercial.
- **Commit:** `441909e` · `docs/adr-iniciales`.

### Sesión 03 · 2026-10-15 · Historias de usuario
- **Objetivo:** generar las historias a partir de los ADR y la especificación.
- **Resultado:** `02-historias/`: 17 historias en 5 épicas con criterios Gherkin sobre los datos semilla; criterios transversales CT-01 a CT-06; catálogo de códigos de error; supuestos SH-01 a SH-06.
- **Decisiones (asistente):** celular de 8 dígitos; botón Cerrar sesión; las deudas vencidas se pueden pagar; historial sin paginación.
- **Problemas:** un escenario de HU-08 dependía de una consulta de "disponible del día" que no existía; se reescribió.
- **Pendientes en ese momento:** la propuesta de separar stack y arquitectura en dos ADR quedó sin decidir (el usuario pasó a las historias).

### Sesión 04 · 2026-10-15 · Especificaciones detalladas
- **Objetivo:** una SPEC por historia con reglas, contratos, errores, casos borde y trazabilidad regla → CA.
- **Resultado:** `03-especificaciones/README.md` (modelo de datos, DTO, orden de procesamiento) y SPEC-HU-01 a SPEC-HU-17: 125 reglas.
- **Cambios en las historias:** criterios numerados `CA-HH.N`; 14 criterios agregados para reglas que no tenían uno; CA-02.2 y CA-07.2 precisados; catálogo ampliado a 26 códigos.
- **Verificación:** script de trazabilidad: 0 reglas sin criterio y 0 criterios sin regla (104 criterios); todos los códigos usados están en el catálogo.
- **Decisiones (asistente):** el límite diario se informa antes que la falta de saldo; el contador de intentos no se reinicia con el tiempo; `ClockSkew = 0`; timeout del frontend de 30 s en la consulta de deudas; consulta de celulares sin límite de frecuencia como riesgo aceptado.

### Sesión 05 · 2026-10-15 · Plan de pruebas y matriz de trazabilidad
- **Objetivo:** plan con alcance, tipos de prueba, datos semilla, entorno y criterios de salida, y la matriz Historia · Criterio · Caso · Tipo · Evidencia.
- **Resultado:** `04-plan-de-pruebas/plan-pruebas.md` y `matriz-trazabilidad.md` con 104 casos `TC-HH-NN` (58 con E2E, 46 con API, 12 unitarios; 12 casos en dos niveles), generada desde las historias.
- **Decisiones (asistente):** umbrales de salida (≥ 95 % aprobados, ≥ 80 % de cobertura del dominio, 100 % en dinero y seguridad); casos con reloj, estado preparado o concurrencia van como API.
- **Commit:** `562df44` · `docs/adr-iniciales`, con las sesiones 03 a 05; rama subida a `origin`.

### Sesión 06 · 2026-10-15 · `CLAUDE.md`
- **Objetivo:** guía para futuras sesiones del asistente.
- **Resultado:** `billeref/CLAUDE.md` con la estructura del flujo, las reglas de trazabilidad, la forma de trabajar con el usuario, los comandos previstos y las decisiones de arquitectura que el código debe cumplir.
- **Pendientes:** commit.

### Sesión 07 · 2026-10-15 · Plan de desarrollo, tareas y bitácora
- **Objetivo:** planificar la construcción a partir de la especificación, las historias y las SPEC.
- **Entradas:** `03-especificaciones/`, `02-historias/`, `04-plan-de-pruebas/`, `01-adr/`.
- **Resultado:** `05-desarrollo/plan-desarrollo.md` (7 fases con hitos, estructura del código, convenciones, definición de terminado, riesgos), `tareas.md` (28 tareas con dependencias, SPEC y casos TC) y esta bitácora.
- **Decisiones (asistente):** fundaciones y dominio primero, luego cortes verticales por épica; pipeline de dinero único (T-17) para transferencias y pagos; nombres de prueba con el ID del caso; una rama por fase.
- **Pendientes:** commit; iniciar la Fase 0 (T-01 a T-05).

### Sesión 08 · 2026-10-15 · Skills del proyecto
- **Objetivo:** skills de testing, convenciones con código limpio para backend y frontend, y revisión, alineadas con las especificaciones.
- **Entradas:** `01-adr/`, `02-historias/`, `03-especificaciones/`, `04-plan-de-pruebas/`, `05-desarrollo/`.
- **Resultado:** `06-skills/README.md` y cuatro skills: `billeref-testing`, `billeref-convenciones-backend`, `billeref-convenciones-frontend` y `billeref-revision`.
- **Decisiones (asistente):** identificadores del dominio en español igual que las SPEC, con sufijos técnicos convencionales; códigos y mensajes de error centralizados; `Nullable` y `TreatWarningsAsErrors` en el backend; componentes *standalone* con `OnPush` y separación contenedor/presentación en el frontend; la revisión usa las severidades del plan de pruebas y exige verificar cada hallazgo antes de reportarlo.
- **Ampliaciones pedidas por el usuario:** en `billeref-testing`, cómo escribir y ejecutar las pruebas (comandos por caso, historia y suite, con reportes y cobertura), cómo usar Playwright MCP con los datos semilla (`referencias/playwright-mcp.md`) y cómo registrar la evidencia (`referencias/reporte-evidencias.md` y plantilla del reporte). En las skills de convenciones, checklist de revisión de montos, logs sin datos sensibles, transacciones y mensajes de error según la SPEC.
- **Decisión (asistente):** los resultados se registran en `08-evidencias/reporte-ejecucion.md` y la matriz no se edita al ejecutar; se actualizaron el plan de pruebas (§7, §10) y las tareas T-27 y T-28.
- **Pendientes:** activar las skills en `.claude/skills/` (Claude Code no las carga desde `06-skills/`); commit.

### Sesión 09 · 2026-10-15 · Activación de skills y MCP de Playwright
- **Objetivo:** activar las skills en Claude Code y registrar el MCP de Playwright con la configuración del plan de pruebas.
- **Tareas:** T-26 (parte de configuración).
- **Resultado:**
  - Skills activadas con uniones de directorio en `.claude/skills/` hacia `06-skills/`; `.claude/skills/` en `.gitignore` porque git atraviesa las uniones.
  - MCP de Playwright registrado (alcance local) y conectado: `@playwright/mcp@0.0.83` con `07-mcp/playwright-mcp.config.json` (Chrome, 390×844 táctil, `America/La_Paz`, `es-BO`, perfil aislado). Documentado en `07-mcp/README.md`.
  - Referencia de Playwright de la skill de pruebas actualizada con las herramientas verificadas.
- **Decisiones:** el usuario pidió `claude mcp add playwright -- npx @playwright/mcp@latest`; el asistente agregó `cmd /c` (necesario en Windows nativo), fijó la versión para que las pruebas sean repetibles y usó Chrome instalado en lugar de descargar Chromium.
- **Problemas:** el modo de desarrollador de Windows no está activo, así que no se pudieron crear enlaces simbólicos; se usaron uniones. Se corrigió una afirmación previa: `browser_install` no existe en la versión actual. Se confirmó que `browser_run_code_unsafe` permite usar `page.clock`, con lo que los casos de inactividad ya no quedan bloqueados.
- **Pendientes:** suite de humo de T-26 (requiere la app construida); commit.

### Sesión 10 · 2026-10-15 · Subagentes y hooks
- **Objetivo:** subagentes `revisor-seguridad` y `tester-e2e`; hooks para bloquear archivos de secretos y verificar después de cada edición.
- **Resultado:**
  - `.claude/agents/revisor-seguridad.md` (solo lectura: PIN, logs, URLs, secretos, sesión, exposición de información; reporte con severidad) y `.claude/agents/tester-e2e.md` (ejecuta casos E2E con Playwright MCP, guarda evidencias y actualiza el reporte; no toca código).
  - `.claude/settings.json` con dos hooks y reglas `deny`: `proteger-secretos.mjs` (PreToolUse) y `verificar-cambios.mjs` (PostToolUse en segundo plano con `asyncRewake`).
- **Verificación:** 25 casos simulados del hook de secretos correctos (bloquea `.env`, `.env.*` y `secrets.json` en lecturas, escrituras, búsquedas y comandos; permite `.env.example` y buscar el texto "env" en código). Hook de verificación probado con un backend falso: código 2 con el error `CS0029` cuando no compila y código 0 al corregirlo; sin código en `05-desarrollo/` no hace nada. Ambos hooks confirmados activos en la sesión.
- **Decisiones (asistente):** hooks en Node para que funcionen igual en Windows y en otros sistemas; también se protege `secrets.json` (allí vive la clave JWT de los *user-secrets*, ADR-003); la verificación corre en segundo plano y omite ejecuciones superpuestas.
- **Limitación conocida:** el hook revisa el texto completo de los comandos de shell, así que también bloquea comandos que solo **mencionan** esos nombres (p. ej. un mensaje de commit o un texto de documentación pasado por la shell). Para documentación, usar las herramientas de edición; en mensajes de commit, evitar escribir el nombre literal.
- **Problemas:** en la máquina solo hay **SDK de .NET 10** (10.0.300), que crea soluciones `.slnx`; hay *runtimes* de .NET 8, así que se puede apuntar a `net8.0`. El hook acepta `.sln` y `.slnx`. Queda por decidir con el usuario la versión de .NET (ADR-001) y el formato de la solución.
- **Pendientes:** decidir .NET 8 o 10 y `.sln` o `.slnx`; commit. *(Resuelto en la sesión 11.)*

### Sesión 11 · 2026-10-15 · Cambio a .NET 10 (ADR-009)
- **Objetivo:** resolver la versión de .NET y el formato de la solución antes de escribir código.
- **Decisión (usuario):** "haz el ajuste": pasar de .NET 8 a **.NET 10 LTS** (interpretado por el asistente como la opción que cambiaba el ADR; informado al usuario).
- **Resultado:** nuevo `01-adr/ADR-009-dotnet-10.md` (`net10.0`, SDK 10.0.300 fijado en `global.json` con `rollForward: latestFeature`, solución `BilleRef.slnx`, paquetes de Microsoft 10.x, `dotnet test` en modo VSTest). ADR-001 queda vigente salvo la versión, con una nota que remite a ADR-009. Actualizados: índice de ADR, `CLAUDE.md`, plan de pruebas (entorno; se quitó el riesgo de .NET 8), plan de desarrollo (estructura y riesgos), tarea T-01, skills `billeref-testing` y `billeref-convenciones-backend`, plantilla del reporte, índice de skills y subagente `revisor-seguridad`.
- **Commit:** este cambio y las sesiones 06 a 10 · `docs/adr-iniciales`.
