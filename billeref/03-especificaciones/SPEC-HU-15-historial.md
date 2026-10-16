# SPEC-HU-15 · Ver el historial de operaciones

- **Historia:** [HU-15](../02-historias/HU-15-ver-historial.md) · **ADR:** 002, 005

## 1. Reglas

- **R-15.1** El historial incluye las operaciones donde el usuario es origen o destino; el tipo se deriva por su lado: origen de transferencia → `TRANSFERENCIA_ENVIADA`, destino → `TRANSFERENCIA_RECIBIDA`, origen de pago → `PAGO_SERVICIO`. → CA-15.2
- **R-15.2** Orden: `fechaUtc` descendente; si empatan, número de operación descendente. → CA-15.2
- **R-15.3** Un usuario nunca ve operaciones en las que no participa. → CA-15.3
- **R-15.4** Sin operaciones (y sin filtros), la interfaz muestra "Aún no tienes movimientos". → CA-15.1, CA-15.3
- **R-15.5** Cada operación muestra tipo, contraparte, fecha y hora Bolivia, y monto con signo; en pagos el monto es el total (monto + comisión). → CA-15.2
- **R-15.6** Sin paginación: se devuelven todas las operaciones que cumplan los filtros. → CA-15.2

## 2. Contratos

### `GET /api/historial`

Sin parámetros = todas las operaciones (filtros en SPEC-HU-16).

Response `200`:
```json
{
  "operaciones": [
    { "numeroOperacion": "OP-20261015-000003", "tipo": "PAGO_SERVICIO",
      "contraparte": "Luz del Valle S.A.", "fecha": "2026-10-15T14:40:00-04:00", "monto": "-186.40" },
    { "numeroOperacion": "OP-20261015-000002", "tipo": "TRANSFERENCIA_RECIBIDA",
      "contraparte": "Bruno E*** M***", "fecha": "2026-10-15T14:35:00-04:00", "monto": "+50.00" },
    { "numeroOperacion": "OP-20261015-000001", "tipo": "TRANSFERENCIA_ENVIADA",
      "contraparte": "Bruno E*** M***", "fecha": "2026-10-15T14:30:00-04:00", "monto": "-150.50" }
  ]
}
```

### Modelo de datos
- `Operacion` (README); `MovimientoDto` (README), el mismo que usa el inicio (SPEC-HU-05).

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `SESION_EXPIRADA` | 401 | Tu sesión expiró. Ingresa nuevamente. | Token inválido o vencido |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| Usuario 70000003 recién iniciado | `operaciones: []` → "Aún no tienes movimientos" |
| Transferencia Ana → Bruno | Ana la ve como `TRANSFERENCIA_ENVIADA` (`-`), Bruno como `TRANSFERENCIA_RECIBIDA` (`+`) |
| Operación fallida (saldo, límite, PIN) | No aparece: solo se registran operaciones exitosas |
| Repetición idempotente | No duplica la entrada |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-15.1 | CA-15.2 |
| R-15.2 | CA-15.2 |
| R-15.3 | CA-15.3 |
| R-15.4 | CA-15.1, CA-15.3 |
| R-15.5 | CA-15.2 |
| R-15.6 | CA-15.2 |

Criterios de HU-15 sin regla: **ninguno** (CA-15.1 a CA-15.3 cubiertos).
