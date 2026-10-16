# ADR-008 · Estrategia de pruebas: xUnit + Jest + Playwright MCP

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-001 a ADR-007

## Contexto

§5 recomienda una web móvil para probar de punta a punta con el MCP de Playwright. Las reglas de negocio (límites, decimales, deuda más antigua, idempotencia, bloqueo) deben ser verificables de forma automática y repetible.

## Decisión

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Unitarias backend | **xUnit** (+ FluentAssertions) | Reglas de `BilleRef.Domain`: montos, decimales, límites, glosa, enmascaramiento, deuda más antigua, cálculo del día con `FakeTimeProvider`. |
| Integración backend | **xUnit + `WebApplicationFactory`** | Endpoints reales con el store en memoria: login, bloqueo, transferencias, pagos, idempotencia, `503` del mock de empresas, ausencia de datos sensibles en logs. |
| Unitarias frontend | **Jest** (`jest-preset-angular`) | Componentes y servicios Angular: validaciones de formulario, *interceptor* de renovación del JWT, temporizador de inactividad, formato `Bs 1.234,50`. |
| Punta a punta | **Playwright vía MCP** | Flujos completos en viewport móvil (p. ej. 390×844) contra frontend y backend levantados. |

- **Datos de prueba:** la semilla de §4. Antes de cada escenario E2E se llama a `POST /api/test/reset` (solo `Development`, ADR-002) para partir del estado inicial.
- **Escenarios E2E mínimos:**
  1. Login exitoso (70000001) y vista de inicio con nombre, saldo y 5 últimos movimientos.
  2. 3 PIN incorrectos → bloqueo de 5 minutos.
  3. Login del usuario bloqueado 70000004 (PIN correcto e incorrecto).
  4. Transferencia exitosa Ana → Bruno y reflejo en el historial de ambos.
  5. Transferencias rechazadas: monto > Bs 3.000, saldo insuficiente (Carla), a uno mismo, a usuario bloqueado.
  6. Doble envío de la misma confirmación → un solo débito.
  7. Pago de LV-1001: solo se habilita 2026-08; luego 2026-09.
  8. NA-3004 sin deudas; código inexistente.
  9. Empresa que no responde → mensaje de servicio no disponible.
  10. Historial con filtros por tipo y fechas, y apertura de comprobante.
  11. Cierre de sesión por inactividad (con el reloj del navegador controlado por Playwright).
- Las evidencias (capturas y reportes) se guardan en `08-evidencias/`.

## Alternativas consideradas

- **Jasmine + Karma** (por defecto en Angular): Karma está obsoleto; Jest es más rápido y no necesita navegador.
- **Cypress** para E2E: la especificación orienta a Playwright MCP.

## Consecuencias

- **Positivas:** las reglas críticas se prueban en el nivel más barato (xUnit) y los flujos en E2E; el reset y `TimeProvider` hacen las pruebas deterministas.
- **Negativas:** Jest requiere configuración adicional en Angular (`jest-preset-angular` o el *builder* de Jest), que debe fijarse en la versión de Angular elegida.
- Las pruebas de bloqueo por 5 minutos e inactividad usan relojes falsos (backend: `FakeTimeProvider`; frontend: `jest.useFakeTimers()` / `page.clock` de Playwright) para no esperar tiempo real.
