# Plan de desarrollo · BilleRef

- **Versión:** 1.0 · **Fecha:** 2026-10-15
- **Entradas:** [especificaciones iniciales](../03-especificaciones/especificaciones-iniciales.md.txt) · [ADR](../01-adr/README.md) · [historias](../02-historias/README.md) · [especificaciones detalladas](../03-especificaciones/README.md) · [plan de pruebas](../04-plan-de-pruebas/plan-pruebas.md)
- **Tareas:** [tareas.md](tareas.md) · **Bitácora:** [bitacora-sesiones.md](bitacora-sesiones.md)

## 1. Objetivo

Construir BilleRef (backend .NET 10 + frontend Angular) hasta cumplir los criterios de salida del plan de pruebas: 104 casos ejecutados, 0 defectos críticos o altos, y evidencias en `08-evidencias/`.

## 2. Estrategia

- **Fundaciones primero, luego cortes verticales por historia.** Primero el andamiaje y las reglas puras del dominio (sin dependencias); después cada épica completa (API + frontend + pruebas) antes de pasar a la siguiente.
- **Pruebas antes que código.** Cada tarea parte de sus casos `TC-HH-NN` de la [matriz](../04-plan-de-pruebas/matriz-trazabilidad.md): se escriben en rojo y se implementa hasta ponerlos en verde.
- **El pipeline de operaciones de dinero se construye una sola vez** (T-17) y lo reutilizan transferencias y pagos; es la pieza de mayor riesgo (atomicidad, idempotencia, concurrencia).
- **E2E al final de cada fase** sobre lo ya construido, y una pasada completa con evidencias al cierre.

## 3. Fases e hitos

| Fase | Tareas | Historias | Hito de salida |
|---|---|---|---|
| 0 · Andamiaje | T-01 a T-05 | — | La solución compila, la semilla carga y `POST /api/test/reset` responde |
| 1 · Dominio | T-06 a T-11 | HU-06, 07, 08, 09, 11, 16 (reglas puras) | Pruebas unitarias del dominio en verde |
| 2 · Acceso | T-12 a T-14 | HU-01 a HU-04 | Login, bloqueo y sesión completos; TC-01 a TC-04 en verde |
| 3 · Inicio y transferencias | T-15 a T-19 | HU-05 a HU-10 | Transferencia de punta a punta con comprobante; TC-05 a TC-10 en verde |
| 4 · Pago de servicios | T-20 a T-22 | HU-11 a HU-14 | Pago de punta a punta con timeout simulado; TC-11 a TC-14 en verde |
| 5 · Historial | T-23 a T-24 | HU-15 a HU-17 | Historial, filtros y comprobante; TC-15 a TC-17 en verde |
| 6 · Cierre de calidad | T-25 a T-28 | Todas | Criterios de salida del plan de pruebas cumplidos |

```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4 ──► Fase 5 ──► Fase 6
                          │          ▲  (T-17 pipeline de dinero)
                          └──────────┘  (T-13 sesión: requisito de todo endpoint autenticado)
```

## 4. Estructura del código

```
05-desarrollo/
├── backend/
│   ├── global.json                   # SDK 10.0.300 fijado (ADR-009)
│   ├── BilleRef.slnx
│   ├── src/
│   │   ├── BilleRef.Api/             # controladores, middleware, DTOs, endpoints de prueba
│   │   ├── BilleRef.Domain/          # entidades, validadores, Mascaras, reglas, constantes
│   │   └── BilleRef.Infrastructure/  # InMemoryStore, repositorios, Seed/, gateway mock
│   ├── tests/
│   │   ├── BilleRef.Domain.Tests/    # unitarias (xUnit)
│   │   └── BilleRef.Api.Tests/       # API con WebApplicationFactory
│   └── tools/HashPin/                # genera los hashes de la semilla
└── frontend/                         # Angular PWA (Jest con jest-preset-angular)
```

## 5. Convenciones

- **Nombres de prueba con su caso:** `TC_07_02_MontosInvalidos` (xUnit) y `describe('TC-07-02 …')` (Jest). Así la matriz se cruza con los reportes buscando el ID.
- **Reglas en el código:** comentario `// R-08.3` solo donde la regla no sea evidente por el nombre del método.
- **Ramas:** una por fase, `feat/fase-N-<tema>` (p. ej. `feat/fase-2-acceso`), fusionada a `main` al cumplir el hito.
- **Commits:** prefijo convencional y la tarea, p. ej. `feat(T-12): login con bloqueo por intentos`.
- **Bitácora:** cada sesión de trabajo agrega una entrada en [bitacora-sesiones.md](bitacora-sesiones.md) antes del commit de cierre.

## 6. Definición de terminado (por tarea)

1. Los casos `TC` asociados en [tareas.md](tareas.md) existen y están en verde (o, si son E2E, ejecutados con evidencia).
2. Ninguna prueba previa se rompió.
3. El comportamiento coincide con la SPEC (reglas, contrato, errores y casos borde); si hubo que desviarse, la SPEC se actualizó primero.
4. Sin PIN, saldos ni celulares completos en logs (NF-01).
5. Tarea marcada en [tareas.md](tareas.md) y sesión registrada en la bitácora.

## 7. Riesgos de desarrollo

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Atomicidad e idempotencia mal implementadas en el pipeline de dinero | Crítico (doble débito) | T-17 aislada, con pruebas concurrentes repetidas 20 veces antes de construir encima |
| `ClockSkew` por defecto de JWT (5 min) | Sesión dura el doble | Fijarlo a cero en T-13; TC-04-06 lo verifica |
| Jest con versiones recientes de Angular | Configuración frágil | Fijar versiones compatibles de `jest-preset-angular` en T-02 antes de escribir componentes |
| Pruebas dependientes del tiempo | Pruebas inestables | `TimeProvider` inyectado desde T-05; nunca `DateTime.Now` |
| Playwright MCP sin configurar | E2E bloqueadas | T-26 configura el MCP en `07-mcp/` antes de la primera ejecución E2E |
| Cambio de versión de .NET (de 8 a 10) | Bajo: no había código | Resuelto por ADR-009 antes de empezar |

## 8. Fuera de este plan

- Las skills de `06-skills/` ya están escritas (testing, convenciones de backend y frontend, revisión); este plan las usa: `billeref-testing` y las de convenciones en cada tarea, `billeref-revision` al cerrar tareas y fases.
- Todo lo excluido en la §6 de la especificación y en la §2 del plan de pruebas.
