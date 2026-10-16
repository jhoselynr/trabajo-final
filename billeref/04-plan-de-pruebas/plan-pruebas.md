# Plan de pruebas · BilleRef

- **Versión:** 1.0 · **Fecha:** 2026-10-15
- **Fuentes:** [especificaciones iniciales](../03-especificaciones/especificaciones-iniciales.md.txt) · [ADR](../01-adr/README.md) · [historias](../02-historias/README.md) · [especificaciones](../03-especificaciones/README.md)
- **Matriz:** [matriz-trazabilidad.md](matriz-trazabilidad.md) — un caso de prueba por criterio de aceptación (104 casos).

## 1. Objetivo

Verificar que BilleRef cumple los 104 criterios de aceptación de las 17 historias y las reglas de las especificaciones, con énfasis en lo que puede hacer perder dinero o exponer datos: atomicidad, doble débito, límites, bloqueo por PIN y datos sensibles en logs.

## 2. Alcance

### En alcance

| Área | Historias | Foco |
|---|---|---|
| Acceso y sesión | HU-01 a HU-04 | Login, bloqueo temporal, cuenta bloqueada, inactividad, recarga, logout |
| Inicio | HU-05 | Saldo, 5 últimos movimientos |
| Transferencias | HU-06 a HU-10 | Destinatario, monto y glosa, límites, comprobante, atomicidad, idempotencia |
| Pago de servicios | HU-11 a HU-14 | Consulta, timeout y reintento, deuda más antigua, comisión, doble pago |
| Historial | HU-15 a HU-17 | Lista, filtros, comprobante, privacidad del saldo |
| Criterios transversales | CT-01 a CT-06 | Montos, fechas Bolivia, logs, sesión, formato de error, interfaz móvil |

### Fuera de alcance

- Todo lo listado en la §6 de la especificación: registro de usuarios, KYC, recuperación de PIN, recargas, QR, pagos internacionales, integraciones reales.
- Pruebas de rendimiento y carga (más allá de las de concurrencia de la §3).
- Pruebas de penetración y auditoría de seguridad formal.
- Navegadores distintos de Chromium y apps nativas iOS/Android.
- Auditoría completa de accesibilidad (WCAG); solo se verifica el uso básico en móvil (CT-06).

## 3. Tipos de prueba

| Tipo | Herramienta | Qué verifica | Casos (criterios cubiertos) |
|---|---|---|---|
| **Unitaria (back)** | xUnit + `Assert`, `FakeTimeProvider` | Reglas puras de `BilleRef.Domain`: validación de monto y glosa, límites, día Bolivia, enmascaramiento, orden de deudas | 12 criterios entre front y back |
| **Unitaria (front)** | Jest + `jest-preset-angular`, `jest.useFakeTimers()` | Validadores de formulario, formato `Bs 1.234,50`, *interceptor* de renovación, temporizador de inactividad, botón deshabilitado | (incluidos en los 12) |
| **API (integración)** | xUnit + `WebApplicationFactory`, store en memoria, `FakeTimeProvider`, dobles de prueba | Endpoints reales: códigos HTTP y de error, atomicidad, idempotencia, concurrencia, tiempo, logs | 46 criterios |
| **E2E** | Playwright vía MCP, Chromium, viewport 390×844 | Flujos completos del usuario contra frontend y backend levantados | 58 criterios |

Un criterio puede verificarse en más de un nivel (12 criterios usan dos tipos); la matriz indica cuáles.

**Criterio para elegir el nivel:**
- **E2E** cuando el criterio describe lo que el usuario ve y se puede reproducir con la semilla.
- **API** cuando requiere preparar estado (acumulado diario, saldo exacto), controlar el reloj (bloqueo de 5 min, medianoche, 24 h), inyectar fallas o lanzar solicitudes concurrentes.
- **Unitaria** para tablas de valores (montos, glosas, formatos) y comportamiento interno del frontend.

### Pruebas no funcionales incluidas

| ID | Verificación | Cómo |
|---|---|---|
| NF-01 | Logs sin PIN, saldos ni celulares completos (CT-03) | Proveedor de logs en memoria en las pruebas API; tras cada prueba se busca `1111`, `2222`, `3333`, `4444` como PIN, los 4 celulares completos y saldos. Incluye TC-01-06. |
| NF-02 | Sin secretos en el repositorio | `git grep` de `BILLEREF_JWT_KEY`, `Jwt:Key` y cadenas largas en base64; la app no arranca sin clave (ADR-003). |
| NF-03 | PIN con hash | `usuarios.json` no contiene `1111`, `2222`, `3333` ni `4444`; los hashes empiezan con el prefijo de `PasswordHasher` v3. |
| NF-04 | Concurrencia | TC-08-07, TC-10-01, TC-14-05: solicitudes paralelas con `Task.WhenAll`. |
| NF-05 | Interfaz móvil (CT-06) | Todas las E2E en 390×844; sin desplazamiento horizontal (`document.documentElement.scrollWidth <= 390`). |
| NF-06 | Sesión sin tolerancia de reloj | TC-04-06: token vencido hace 1 s es rechazado. |

### Suite de humo (se ejecuta primero en cada versión)

TC-01-01, TC-03-01, TC-05-01, TC-06-01, TC-09-02, TC-09-03, TC-10-01, TC-11-02, TC-12-01, TC-13-02, TC-14-01, TC-15-02, TC-17-02.

## 4. Datos semilla

Todos los datos son ficticios (§4 de la especificación). Se cargan desde `BilleRef.Infrastructure/Seed/` al iniciar y se restablecen con `POST /api/test/reset` antes de **cada** caso E2E y en cada prueba API (instancia nueva de `WebApplicationFactory`).

### Usuarios

| Celular | Nombre | Enmascarado | PIN | Saldo | Estado | Uso principal |
|---|---|---|---|---|---|---|
| 70000001 | Ana Ficticia Rojas | Ana F\*\*\* R\*\*\* | 1111 | Bs 5.000,00 | Activo | Origen de transferencias y pagos |
| 70000002 | Bruno Ejemplo Mamani | Bruno E\*\*\* M\*\*\* | 2222 | Bs 800,00 | Activo | Destinatario; saldo límite (800) |
| 70000003 | Carla Prueba Quispe | Carla P\*\*\* Q\*\*\* | 3333 | Bs 0,00 | Activo | Saldo insuficiente; historial vacío; acceso ajeno |
| 70000004 | Diego Demo Vargas | Diego D\*\*\* V\*\*\* | 4444 | Bs 1.200,00 | Bloqueado | Cuenta bloqueada; destino no disponible |
| 79999999 | — | — | — | — | Inexistente | Celular que no existe |

### Empresas y deudas

| Empresa (`id`) | Código | Periodo | Monto | Vence | Uso principal |
|---|---|---|---|---|---|
| Luz del Valle S.A. (`luz-del-valle`) | LV-1001 | 2026-08 | Bs 185,40 | 2026-09-15 | Deuda más antigua, vencida |
| Luz del Valle S.A. (`luz-del-valle`) | LV-1001 | 2026-09 | Bs 172,10 | 2026-10-15 | Deuda bloqueada por orden |
| Aguas Claras (`aguas-claras`) | AC-2002 | 2026-09 | Bs 64,00 | 2026-10-20 | Saldo que cubre el monto pero no la comisión |
| NetAndes (`netandes`) | NA-3003 | 2026-10 | Bs 249,00 | 2026-10-25 | Pago de Bruno; doble pago |
| NetAndes (`netandes`) | NA-3004 | — | — | — | Código sin deudas |
| Luz del Valle S.A. | LV-9999 | — | — | — | Código inexistente |

### Datos preparados (solo pruebas API)

Se cargan con un *builder* de escenario que escribe directamente en el store en memoria de la `WebApplicationFactory`, nunca en los archivos semilla.

| Dato preparado | Casos |
|---|---|
| Ana con saldo Bs 20.000,00 y transferencias enviadas hoy por Bs 9.000,00 | TC-08-03, TC-08-04, TC-08-06 |
| Ana con saldo Bs 20.000,00 y transferencias enviadas hoy por Bs 8.000,00 | TC-08-07 |
| Ana con Bs 10.000,00 enviados el 15/10/2026 a las 23:59 Bolivia | TC-08-05 |
| Usuario con saldo exacto Bs 64,00 | TC-13-06 |
| Operaciones fechadas el 13/10 10:00, 14/10 23:59 y 15/10 00:00 (Bolivia) | TC-16-01 a TC-16-04, TC-16-07 |
| Repositorio de operaciones que lanza una excepción | TC-09-06, TC-13-08 |
| Gateway de empresas que falla solo la primera vez | TC-12-04 |
| Bruno pasado a `BLOQUEADO` después de identificarlo | TC-06-06 |

## 5. Entorno

| Elemento | Valor |
|---|---|
| Sistema operativo | Windows 11 (cualquier SO con las mismas versiones sirve) |
| Backend | SDK de .NET 10 (10.0.300, fijado en `global.json`); `ASPNETCORE_ENVIRONMENT=Development`; HTTPS con el certificado de desarrollo (`dotnet dev-certs https --trust`) |
| Clave JWT | `dotnet user-secrets set "Jwt:Key" "<clave de 32+ bytes>"` en el proyecto `BilleRef.Api` (nunca en el repositorio) |
| Configuración E2E | `Servicios__TimeoutSegundos=2` (variable de entorno) para no esperar 20 s en HU-12 |
| Frontend | Node.js LTS, Angular CLI; `ng serve` con `proxy.conf.json` hacia la API |
| Navegador E2E | Google Chrome (Chromium) controlado por `@playwright/mcp@0.0.83`; viewport 390×844 táctil; zona horaria `America/La_Paz`; perfil aislado. Configuración en [`07-mcp/`](../07-mcp/README.md) |
| Reloj | Backend: `FakeTimeProvider` en pruebas unitarias y API. Frontend: `jest.useFakeTimers()` y `page.clock` de Playwright |
| Endpoints de prueba | `POST /api/test/reset` y `POST /api/test/empresas/comportamiento` (solo `Development`) |
| Reportes | xUnit → `.trx` + HTML; Jest → JUnit XML; cobertura con `coverlet` |

**Arranque para E2E** (PowerShell; rutas previstas en `05-desarrollo/`):
```powershell
# Terminal 1 — backend
cd 05-desarrollo/backend
$env:Servicios__TimeoutSegundos = "2"
dotnet run --project BilleRef.Api

# Terminal 2 — frontend
cd 05-desarrollo/frontend
npm ci
ng serve
```

## 6. Criterios de entrada

- El backend y el frontend compilan sin errores.
- Las pruebas unitarias (back y front) están en verde antes de ejecutar API y E2E.
- La semilla carga los 4 usuarios y las 5 combinaciones empresa-código de la §4.
- Los endpoints de prueba responden en `Development`.
- Las especificaciones y la matriz están aprobadas (sin cambios pendientes).

## 7. Ejecución

1. Unitarias (back y front) en cada cambio.
2. API (integración) en cada cambio.
3. Suite de humo E2E.
4. E2E completa.
5. Verificaciones no funcionales NF-01 a NF-06.

Cada caso se registra en `08-evidencias/reporte-ejecucion.md` con su resultado (Aprobado / Fallido / Bloqueado), la ruta de su evidencia y, si falla, su defecto. La matriz no se edita al ejecutar: es el plan; el reporte es lo ejecutado. Procedimiento en la skill `billeref-testing` (`06-skills/billeref-testing/referencias/reporte-evidencias.md`).

## 8. Gestión de defectos

| Severidad | Definición | Ejemplo |
|---|---|---|
| Crítica | Pérdida o duplicación de dinero, o exposición de PIN | Doble débito; saldo modificado tras un error; PIN en logs |
| Alta | Regla de negocio o de seguridad incumplida sin pérdida de dinero | Límite diario mal calculado; bloqueo que no se activa; saldo ajeno visible |
| Media | Funcionalidad incorrecta con alternativa | Filtro de fechas que excluye el último día; mensaje equivocado |
| Baja | Cosmético | Formato `Bs 1234.5` en lugar de `Bs 1.234,50` en una pantalla |

## 9. Criterios de salida

Se da por terminada la fase de pruebas cuando se cumplen **todos**:

1. Los **104** casos de la matriz están ejecutados (ninguno Bloqueado sin justificación).
2. **0 defectos abiertos** de severidad Crítica o Alta.
3. **100 % aprobados** en los casos de dinero y seguridad: HU-02, HU-03, HU-07 a HU-10, HU-13 y HU-14.
4. **≥ 95 % aprobados** del total; cada fallo restante tiene un defecto Medio o Bajo registrado.
5. NF-01 a NF-06 aprobadas.
6. Cobertura de líneas de `BilleRef.Domain` **≥ 80 %**.
7. Cada caso tiene su evidencia en `08-evidencias/`.

## 10. Evidencias

Ruta: `08-evidencias/<TC-ID>/`, registradas en `08-evidencias/reporte-ejecucion.md` (plantilla en `06-skills/billeref-testing/plantillas/`).

| Tipo de prueba | Evidencia |
|---|---|
| E2E | Captura PNG del estado final (`TC-09-02_comprobante.png`) y, si aplica, de pasos intermedios |
| API | Extracto del reporte xUnit del caso y cuerpos de respuesta relevantes (`TC-10-01_respuestas.json`) |
| Unitaria | Extracto del reporte Jest o xUnit |
| Global | `08-evidencias/reportes/`: `.trx`, HTML, JUnit XML y cobertura |

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| Pruebas dependientes del tiempo (bloqueo, medianoche, inactividad, 24 h) | Relojes falsos en todos los niveles; nunca esperas reales |
| Pruebas de concurrencia inestables | Repetir 20 veces cada caso concurrente en la ejecución; un solo fallo es defecto Crítico |
| E2E con Playwright MCP conducido por un agente, menos repetible que un script | Pasos fijos por caso en esta matriz, reset antes de cada caso y capturas obligatorias |
| Fechas reales: la deuda 2026-09 pasa a "Vencida" después del 15/10/2026 | Los casos E2E no afirman "Vencida" sobre esa deuda; la regla se prueba en API con reloj falso |
