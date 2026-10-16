# SPEC-HU-16 · Filtrar el historial por tipo y fechas

- **Historia:** [HU-16](../02-historias/HU-16-filtrar-historial.md) · **ADR:** 005, 001

## 1. Reglas

- **R-16.1** `tipo` acepta `TRANSFERENCIA_ENVIADA`, `TRANSFERENCIA_RECIBIDA` o `PAGO_SERVICIO`; vacío o ausente = todos. En la interfaz: "Todas", "Transferencias enviadas", "Transferencias recibidas", "Pagos de servicios". → CA-16.1
- **R-16.2** `desde` y `hasta` son fechas `AAAA-MM-DD` de Bolivia e inclusivas: `fechaUtc >= desde 00:00:00−04:00` y `fechaUtc < (hasta + 1 día) 00:00:00−04:00`. → CA-16.2, CA-16.3
- **R-16.3** `desde` y `hasta` son opcionales e independientes: solo `desde` = desde esa fecha en adelante; solo `hasta` = hasta esa fecha. → CA-16.7
- **R-16.4** Si `desde > hasta`, `400 RANGO_FECHAS_INVALIDO`; la interfaz lo valida antes de enviar. → CA-16.5
- **R-16.5** Los filtros se combinan con Y lógico y el orden sigue siendo el de SPEC-HU-15. → CA-16.4
- **R-16.6** Si hay filtros y no hay resultados, la interfaz muestra "No hay operaciones para los filtros elegidos". → CA-16.4
- **R-16.7** Elegir "Todas" y borrar las fechas vuelve a la lista completa. → CA-16.6

## 2. Contratos

### `GET /api/historial?tipo={tipo}&desde={AAAA-MM-DD}&hasta={AAAA-MM-DD}`

Ejemplo: `GET /api/historial?tipo=TRANSFERENCIA_ENVIADA&desde=2026-10-13&hasta=2026-10-14`

Response `200`: igual que SPEC-HU-15 (`{ "operaciones": [...] }`).

Los parámetros no contienen datos sensibles, así que pueden ir en la *query string* (ADR-007).

### Modelo de datos
- `Operacion.fechaUtc` y tipo derivado (SPEC-HU-15).
- Conversión: `DateOnly` + `TimeSpan.FromHours(-4)` → `DateTimeOffset` → UTC.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `RANGO_FECHAS_INVALIDO` | 400 | La fecha inicial no puede ser posterior a la final | `desde > hasta` |
| `SOLICITUD_INVALIDA` | 400 | No se pudo procesar la solicitud | `tipo` desconocido o fecha que no es `AAAA-MM-DD` válida |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| `desde = hasta = 2026-10-14` | Incluye la operación del 14/10 a las 23:59 Bolivia (03:59 UTC del 15) |
| Operación del 15/10 a las 00:00 Bolivia | No entra en `hasta = 2026-10-14`; sí en `desde = 2026-10-15` |
| `desde` en el futuro | `200` con lista vacía |
| `hasta` sin `desde` | Todas hasta esa fecha inclusive |
| `desde = 2026-02-30` | `SOLICITUD_INVALIDA` |
| `tipo=transferencia_enviada` en minúsculas | Se acepta sin distinguir mayúsculas |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-16.1 | CA-16.1 |
| R-16.2 | CA-16.2, CA-16.3 |
| R-16.3 | CA-16.7 |
| R-16.4 | CA-16.5 |
| R-16.5 | CA-16.4 |
| R-16.6 | CA-16.4 |
| R-16.7 | CA-16.6 |

Criterios de HU-16 sin regla: **ninguno** (CA-16.1 a CA-16.7 cubiertos).
