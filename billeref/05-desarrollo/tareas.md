# Tareas · BilleRef

- **Plan:** [plan-desarrollo.md](plan-desarrollo.md) · **Bitácora:** [bitacora-sesiones.md](bitacora-sesiones.md)
- **Tamaño:** S (≤ 1 sesión) · M (1–2 sesiones) · L (2–3 sesiones).
- **Estado:** `[ ]` pendiente · `[~]` en curso · `[x]` terminada. Al terminar una tarea, anotar la sesión de la bitácora que la cerró.
- **TC:** casos de la [matriz](../04-plan-de-pruebas/matriz-trazabilidad.md) que deben quedar en verde. `TC-07-02 (u)` = solo la parte unitaria de ese caso.

## Resumen

| Fase | Tareas | Estado |
|---|---|---|
| 0 · Andamiaje | T-01 a T-05 | 0/5 |
| 1 · Dominio | T-06 a T-11 | 0/6 |
| 2 · Acceso | T-12 a T-14 | 0/3 |
| 3 · Inicio y transferencias | T-15 a T-19 | 0/5 |
| 4 · Pago de servicios | T-20 a T-22 | 0/3 |
| 5 · Historial | T-23 a T-24 | 0/2 |
| 6 · Cierre de calidad | T-25 a T-28 | 0/4 (T-26 en curso) |
| **Total** | **28** | **0/28** |

---

## Fase 0 · Andamiaje

### [ ] T-01 · Solución backend
- **Tamaño:** S · **Depende de:** — · **ADR:** 001, 008, 009
- Crear `global.json` (SDK 10.0.300, `rollForward: latestFeature`) y `BilleRef.slnx` con `BilleRef.Api`, `BilleRef.Domain`, `BilleRef.Infrastructure`, `BilleRef.Domain.Tests` y `BilleRef.Api.Tests` (`net10.0`, ADR-009), con las referencias entre proyectos.
- Paquetes: xUnit, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.Extensions.TimeProvider.Testing`, `coverlet.collector`, `Polly.Core`, `Microsoft.Extensions.Identity.Core`. **No** FluentAssertions.
- `.gitignore` con `bin/`, `obj/`, `appsettings.*.local.json`, `.env`, `secrets.json`.
- **Hecho cuando:** `dotnet build` y `dotnet test` (sin pruebas) terminan sin errores.

### [ ] T-02 · Proyecto frontend
- **Tamaño:** M · **Depende de:** — · **ADR:** 001, 005, 008
- Angular con TypeScript estricto y `@angular/pwa`; `proxy.conf.json` hacia la API; *locale* `es-BO` registrado.
- Jest con `jest-preset-angular` (versión compatible con la de Angular), sin Karma.
- Pipe `bs` para mostrar montos como `Bs 1.234,50` (CT-01) y pipe de fecha `dd/MM/aaaa HH:mm` en hora de Bolivia (CT-02).
- **Hecho cuando:** `ng build` y `npx jest` terminan sin errores; prueba de ejemplo del pipe `bs`.

### [ ] T-03 · Configuración transversal de la API
- **Tamaño:** M · **Depende de:** T-01 · **ADR:** 001, 003, 007 · **SPEC:** README (convenciones, errores)
- Lectura de `Jwt:Key` desde *user-secrets* o la variable `BILLEREF_JWT_KEY`; la app **no arranca** si falta.
- `appsettings.json`: `Servicios:TimeoutSegundos = 10`, `Servicios:Reintentos = 1`, `Logging:LogLevel:Microsoft.AspNetCore = Warning`.
- Middleware de errores: excepciones de negocio → `ProblemDetails` con `codigo`, `detail`, `traceId` y extras (`intentosRestantes`, `minutosRestantes`, `disponibleHoy`); excepciones no controladas → `500 ERROR_INTERNO` sin traza.
- Cuerpos malformados → `400 SOLICITUD_INVALIDA`.
- **Hecho cuando:** pruebas API del formato de error y del arranque sin clave en verde.

### [ ] T-04 · Semilla y hash de PIN
- **Tamaño:** S · **Depende de:** T-01 · **ADR:** 002, 003 · **NF:** NF-03
- `tools/HashPin`: recibe un PIN y devuelve el hash de `PasswordHasher<Usuario>`.
- `Seed/usuarios.json` (id GUID fijo, celular, nombre, `pinHash`, saldo, estado) y `Seed/empresas.json` (empresas con `id`, clientes, deudas) con los datos de la §4.
- **Hecho cuando:** NF-03 pasa: ningún PIN en claro en la semilla.

### [ ] T-05 · Store en memoria y endpoints de prueba
- **Tamaño:** M · **Depende de:** T-03, T-04 · **ADR:** 002, 005 · **SPEC:** README (modelo de datos)
- `InMemoryStore` *singleton* con usuarios, operaciones, clientes, deudas, intentos de acceso, sesiones revocadas, claves de idempotencia y correlativo.
- `IUsuarioRepository`, `IOperacionRepository`, `IDeudaRepository`; carga de la semilla al iniciar.
- `TimeProvider` registrado (`TimeProvider.System`; `FakeTimeProvider` en pruebas).
- `POST /api/test/reset` solo en `Development` (restablece **todo**, incluido el correlativo).
- *Builder* de escenarios para pruebas API (datos preparados de la §4 del plan de pruebas).
- **Hecho cuando:** prueba API: reset devuelve 4 usuarios con los saldos iniciales; el endpoint no existe fuera de `Development`.

---

## Fase 1 · Dominio (pruebas unitarias)

### [ ] T-06 · Validador de monto
- **Tamaño:** S · **Depende de:** T-01 · **SPEC:** HU-07 (R-07.1 a R-07.5), HU-08 (R-08.1, R-08.2)
- Normalización (coma/punto), formato, > 0, ≤ 2 decimales sin redondeo, ≤ 3000, > 7 dígitos enteros.
- **TC:** TC-07-01 (u), TC-07-02 (u), TC-08-08 (u).

### [ ] T-07 · Validador de glosa
- **Tamaño:** S · **Depende de:** T-01 · **SPEC:** HU-07 (R-07.7, R-07.8)
- Vacía → `null`; saltos de línea → espacio; recorte; ≤ 60 (longitud UTF-16).
- **TC:** TC-07-06, TC-07-08.

### [ ] T-08 · Máscaras
- **Tamaño:** S · **Depende de:** T-01 · **SPEC:** HU-06 (R-06.3) · **ADR:** 007
- `Mascaras.Nombre`, `Mascaras.Celular` (`******01`), `Mascaras.CodigoCliente` (`LV-**01`).
- **TC:** base de TC-06-01; casos borde de SPEC-HU-06 (una palabra, espacios dobles, tildes).

### [ ] T-09 · Hora de Bolivia y rangos de fechas
- **Tamaño:** S · **Depende de:** T-01 · **SPEC:** HU-08 (R-08.4), HU-16 (R-16.2)
- Día calendario Bolivia `[inicio, fin)` en UTC; conversión de `desde`/`hasta` inclusivos.
- **TC:** TC-16-03 (u); casos borde de 23:59:59 y 00:00 de SPEC-HU-08.

### [ ] T-10 · Número de operación
- **Tamaño:** S · **Depende de:** T-09 · **SPEC:** HU-09 (R-09.5)
- `OP-AAAAMMDD-NNNNNN` con fecha Bolivia y correlativo del store.
- **TC:** base de TC-09-02.

### [ ] T-11 · Orden de deudas
- **Tamaño:** S · **Depende de:** T-09 · **SPEC:** HU-11 (R-11.3 a R-11.5, R-11.8), HU-13 (R-13.3)
- Orden por vencimiento y periodo, `pagable` solo la primera, `motivoNoPagable`, `vencida`, `comision` y `total`.
- **TC:** base de TC-11-02, TC-11-03, TC-13-04.

---

## Fase 2 · Acceso

### [ ] T-12 · Login, bloqueo temporal y cuenta bloqueada
- **Tamaño:** M · **Depende de:** T-05 · **SPEC:** HU-01, HU-02, HU-03
- `POST /api/auth/login` con el orden de evaluación de SPEC-HU-01; hash ficticio para celulares inexistentes; `IntentosAcceso` atómico por celular; `403`, `423`, minutos restantes redondeados hacia arriba.
- **TC:** TC-01-03, TC-01-06, TC-01-07 (API), TC-02-02, TC-02-03, TC-02-04, TC-02-06, TC-03-03, TC-03-04.

### [ ] T-13 · JWT, renovación, logout y revocación
- **Tamaño:** M · **Depende de:** T-12 · **SPEC:** HU-04 · **ADR:** 003
- Emisión HS256 (`sub`, `sid`, 5 min), `ClockSkew = 0`, filtro que agrega `X-Renewed-Token` a toda respuesta `2xx` autenticada, `POST /api/auth/renovar`, `POST /api/auth/logout` (204 idempotente), `SesionRevocada`, verificación de `estado = ACTIVO` en cada petición.
- **TC:** TC-04-04 (API), TC-04-06 (API).

### [ ] T-14 · Frontend de acceso y sesión
- **Tamaño:** L · **Depende de:** T-02, T-13 · **SPEC:** HU-01 a HU-04
- Pantalla de ingreso (campo PIN según R-01.6), `AuthService` con token en memoria, *interceptor* (Bearer, `X-Renewed-Token`, `401` → login), *guard*, temporizador de inactividad de 5 min y renovación antes de vencer.
- **TC:** TC-01-04, TC-01-05, TC-04-02 (u); E2E de fase: TC-01-01, TC-01-02, TC-01-07, TC-02-01, TC-02-05, TC-03-01, TC-03-02, TC-04-01, TC-04-03, TC-04-04, TC-04-05, TC-04-06.

---

## Fase 3 · Inicio y transferencias

### [ ] T-15 · API de inicio
- **Tamaño:** S · **Depende de:** T-13 · **SPEC:** HU-05
- `GET /api/inicio` con nombre, saldo y 5 `MovimientoDto` (tipo derivado, contraparte enmascarada, signo, total en pagos).
- **TC:** TC-05-03 (API).

### [ ] T-16 · API de destinatario
- **Tamaño:** S · **Depende de:** T-08, T-13 · **SPEC:** HU-06
- `POST /api/transferencias/destinatario`: formato, a sí mismo, inexistente o bloqueado.
- **TC:** base de TC-06-01 a TC-06-04.

### [ ] T-17 · Pipeline de operaciones de dinero
- **Tamaño:** L · **Depende de:** T-12, T-13 · **SPEC:** README (orden de procesamiento), HU-10 · **ADR:** 002, 004
- Componente reutilizable con los 10 pasos del orden común: validación de `Idempotency-Key`, verificación del PIN fuera del lock con contador compartido (R-02.5), `SemaphoreSlim(1,1)` global, búsqueda y guardado de la clave con huella SHA-256 sin PIN, vigencia de 24 h, aplicación con restauración ante excepción, `Idempotent-Replayed: true`.
- Pruebas concurrentes repetidas 20 veces.
- **TC:** TC-10-02, TC-10-03, TC-10-05, TC-10-07, TC-10-08, TC-02-05 (API).

### [ ] T-18 · API de transferencias
- **Tamaño:** M · **Depende de:** T-06, T-07, T-10, T-16, T-17 · **SPEC:** HU-07, HU-08, HU-09
- `POST /api/transferencias` sobre el pipeline: reglas en el orden de SPEC-HU-09 (destinatario → límite diario → saldo), débito y crédito, `Operacion` con saldo resultante de cada parte, comprobante, notificación simulada en el log.
- **TC:** TC-06-06, TC-07-07 (API), TC-08-03 a TC-08-07, TC-09-06, TC-10-01 (API), TC-10-04.

### [ ] T-19 · Frontend de inicio y transferencias
- **Tamaño:** L · **Depende de:** T-14, T-15, T-18 · **SPEC:** HU-05 a HU-10
- Inicio con accesos; flujo destinatario → monto y glosa → confirmación → comprobante; clave de idempotencia generada al entrar a la confirmación y regenerada al volver a editar; botón deshabilitado durante el envío; reingreso del PIN sin rehacer la transferencia.
- **TC:** TC-06-05, TC-07-01 (u), TC-07-02 (u), TC-07-07 (u), TC-08-08 (u), TC-10-06; E2E de fase: TC-05-01 a TC-05-05, TC-06-01 a TC-06-04, TC-07-03 a TC-07-05, TC-08-01, TC-08-02, TC-09-01 a TC-09-05, TC-10-01.

---

## Fase 4 · Pago de servicios

### [ ] T-20 · API de servicios, gateway simulado y resiliencia
- **Tamaño:** M · **Depende de:** T-11, T-13 · **SPEC:** HU-11, HU-12 · **ADR:** 006
- `GET /api/servicios`, `POST /api/servicios/deudas`, `IEmpresaServiciosGateway` + `EmpresaServiciosMock` (lee `IDeudaRepository`, respeta `CancellationToken`), `ResiliencePipeline` de Polly v8 (retry externo, timeout interno) configurable, `POST /api/test/empresas/comportamiento`.
- **TC:** TC-11-06, TC-12-04.

### [ ] T-21 · API de pagos
- **Tamaño:** M · **Depende de:** T-17, T-20 · **SPEC:** HU-13, HU-14
- `POST /api/pagos` sobre el pipeline con el orden de SPEC-HU-13; monto desde el repositorio; huella `P|…`; idempotencia antes de `DEUDA_YA_PAGADA`.
- **TC:** TC-13-04, TC-13-06, TC-13-08, TC-13-09, TC-14-01 (API), TC-14-02, TC-14-03, TC-14-05.

### [ ] T-22 · Frontend de pago de servicios
- **Tamaño:** L · **Depende de:** T-19, T-21 · **SPEC:** HU-11 a HU-14
- Tipo → empresa → código; "Consultando deudas…"; lista con la deuda pagable y las bloqueadas; timeout HTTP de 30 s; `503` con botón Reintentar; confirmación con comisión y total del backend; comprobante.
- **TC:** E2E de fase: TC-11-01 a TC-11-05, TC-11-07, TC-12-01 a TC-12-03, TC-13-01 a TC-13-03, TC-13-05, TC-13-07, TC-14-01, TC-14-04.

---

## Fase 5 · Historial

### [ ] T-23 · API de historial y comprobante
- **Tamaño:** M · **Depende de:** T-09, T-18, T-21 · **SPEC:** HU-15, HU-16, HU-17
- `GET /api/historial` con filtros y validaciones; `GET /api/operaciones/{numero}/comprobante` con control de participante y `404` uniforme; saldo resultante según el lado.
- **TC:** TC-15-03, TC-16-01 a TC-16-04 (API), TC-16-05 (API), TC-16-07, TC-17-02 (API), TC-17-04.

### [ ] T-24 · Frontend de historial y comprobante
- **Tamaño:** M · **Depende de:** T-19, T-23 · **SPEC:** HU-15 a HU-17
- Lista, filtros con validación de rango, mensajes de vacío, pantalla de comprobante compartida desde el inicio y el historial.
- **TC:** TC-16-04 (u); E2E de fase: TC-15-01, TC-15-02, TC-16-05, TC-16-06, TC-17-01 a TC-17-03, TC-17-05.

---

## Fase 6 · Cierre de calidad

### [ ] T-25 · Verificaciones no funcionales
- **Tamaño:** M · **Depende de:** T-23 · **Plan de pruebas:** NF-01 a NF-06
- Proveedor de logs en memoria compartido por toda la suite API con la verificación de datos sensibles; escaneo de secretos; verificación de la semilla; ausencia de desplazamiento horizontal a 390 px.
- **TC:** TC-01-06 y NF-01 a NF-06.

### [~] T-26 · Playwright MCP y suite de humo
- **Tamaño:** S · **Depende de:** T-24 · **Carpeta:** `07-mcp/`
- ~~Configurar el MCP de Playwright (Chromium, 390×844, zona horaria `America/La_Paz`) y documentarlo en `07-mcp/`.~~ Hecho en la sesión 09: `@playwright/mcp@0.0.83` con Chrome y `07-mcp/playwright-mcp.config.json`.
- Ejecutar la suite de humo del plan de pruebas (§3) con evidencias.

### [ ] T-27 · E2E completa y evidencias
- **Tamaño:** L · **Depende de:** T-26
- Ejecutar los 58 casos E2E con reset previo, guardar capturas en `08-evidencias/<TC-ID>/` y registrar el resultado de cada caso en `08-evidencias/reporte-ejecucion.md` (skill `billeref-testing`).

### [ ] T-28 · Reportes y criterios de salida
- **Tamaño:** S · **Depende de:** T-25, T-27
- Reportes `.trx`, HTML, JUnit y cobertura en `08-evidencias/reportes/`; completar el resumen y los 7 criterios de salida en `08-evidencias/reporte-ejecucion.md` y dejar el resultado en la bitácora.
