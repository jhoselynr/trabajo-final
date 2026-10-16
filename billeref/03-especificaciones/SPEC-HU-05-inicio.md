# SPEC-HU-05 · Ver saldo y últimos 5 movimientos

- **Historia:** [HU-05](../02-historias/HU-05-inicio-saldo-y-movimientos.md) · **ADR:** 002, 005

## 1. Reglas

- **R-05.1** La pantalla muestra el nombre completo del usuario autenticado y su saldo con formato `Bs 1.234,50`. → CA-05.1, CA-05.2
- **R-05.2** Se muestran como máximo los **5** movimientos más recientes, ordenados por `fechaUtc` descendente y, si hay empate, por número de operación descendente. → CA-05.3
- **R-05.3** Los movimientos incluyen los tres tipos (`TRANSFERENCIA_ENVIADA`, `TRANSFERENCIA_RECIBIDA`, `PAGO_SERVICIO`). La contraparte es el nombre enmascarado del otro usuario o el nombre de la empresa. El monto lleva signo: `-` para débitos y `+` para créditos; en pagos es el total (monto + comisión). → CA-05.4
- **R-05.4** Sin movimientos se muestra "Aún no tienes movimientos". → CA-05.1
- **R-05.5** La pantalla ofrece los accesos "Transferir", "Pagar servicios", "Historial" y "Cerrar sesión". → CA-05.5
- **R-05.6** El saldo y los movimientos se leen del backend cada vez que se entra a la pantalla (sin caché en el frontend), de modo que reflejan operaciones recibidas. → CA-05.4

## 2. Contratos

### `GET /api/inicio`

Response `200`:
```json
{
  "nombre": "Bruno Ejemplo Mamani",
  "saldo": "700.50",
  "movimientos": [
    { "numeroOperacion": "OP-20261015-000002", "tipo": "PAGO_SERVICIO",
      "contraparte": "NetAndes", "fecha": "2026-10-15T14:35:00-04:00", "monto": "-250.00" },
    { "numeroOperacion": "OP-20261015-000001", "tipo": "TRANSFERENCIA_RECIBIDA",
      "contraparte": "Ana F*** R***", "fecha": "2026-10-15T14:30:00-04:00", "monto": "+150.50" }
  ]
}
```

### Modelo de datos
- `Usuario.nombre`, `Usuario.saldo`.
- `Operacion` filtrada por `usuarioOrigenId = yo` o `usuarioDestinoId = yo`; el tipo del movimiento se deriva según el lado del usuario.
- `MovimientoDto` (ver README).

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `SESION_EXPIRADA` | 401 | Tu sesión expiró. Ingresa nuevamente. | Token inválido o vencido (SPEC-HU-04) |

## 4. Casos borde

| Caso | Resultado esperado |
|---|---|
| Exactamente 5 movimientos | Se muestran los 5 |
| 6 o más movimientos | Se muestran los 5 más recientes |
| Dos operaciones con el mismo `fechaUtc` | Desempata el número de operación mayor primero |
| Saldo `0.00` | Se muestra "Bs 0,00" |
| Saldo con miles | `"12345.60"` → "Bs 12.345,60" |
| Recibió una transferencia mientras estaba en otra pantalla | Al volver al inicio aparece (R-05.6) |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-05.1 | CA-05.1, CA-05.2 |
| R-05.2 | CA-05.3 |
| R-05.3 | CA-05.4 |
| R-05.4 | CA-05.1 |
| R-05.5 | CA-05.5 |
| R-05.6 | CA-05.4 |

Criterios de HU-05 sin regla: **ninguno** (CA-05.1 a CA-05.5 cubiertos).
