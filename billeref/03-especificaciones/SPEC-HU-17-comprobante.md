# SPEC-HU-17 · Ver el comprobante de una operación

- **Historia:** [HU-17](../02-historias/HU-17-ver-comprobante.md) · **ADR:** 001, 002

## 1. Reglas

- **R-17.1** El comprobante de una transferencia enviada muestra número, fecha y hora Bolivia, destinatario enmascarado, monto, glosa y el saldo resultante del origen. → CA-17.1
- **R-17.2** El comprobante de una transferencia recibida muestra el remitente enmascarado y el saldo resultante **del destinatario**; nunca expone `saldoResultanteOrigen`. → CA-17.2
- **R-17.3** El comprobante de un pago muestra número, fecha, empresa, código, periodo, monto, comisión, total y saldo resultante. → CA-17.3
- **R-17.4** Solo el origen o el destino de la operación pueden verla. En cualquier otro caso (otro usuario, número inexistente o mal formado) se responde `404 OPERACION_NO_ENCONTRADA`, sin distinguir el motivo. → CA-17.4
- **R-17.5** El comprobante se abre tocando una operación en el historial o en los últimos movimientos del inicio; ambos usan el mismo endpoint y la misma pantalla. → CA-17.5

## 2. Contratos

### `GET /api/operaciones/{numero}/comprobante`

El número de operación no es un dato sensible y puede ir en la URL.

Response `200` para una transferencia (`ComprobanteTransferenciaDto`), consultada por el destinatario:
```json
{
  "numeroOperacion": "OP-20261015-000001",
  "fecha": "2026-10-15T14:30:00-04:00",
  "tipo": "TRANSFERENCIA_RECIBIDA",
  "contraparte": { "rol": "REMITENTE", "nombreEnmascarado": "Ana F*** R***" },
  "monto": "150.50",
  "glosa": "Almuerzo",
  "saldoResultante": "950.50"
}
```

Response `200` para un pago: `ComprobantePagoDto` (README y SPEC-HU-13).

### Modelo de datos
- `Operacion` completa; `saldoResultante` = `saldoResultanteOrigen` si el usuario es origen, `saldoResultanteDestino` si es destino.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `OPERACION_NO_ENCONTRADA` | 404 | No encontramos esa operación | No existe, está mal formada o el usuario no participa |
| `SESION_EXPIRADA` | 401 | Tu sesión expiró. Ingresa nuevamente. | Token inválido o vencido |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| Carla pide un comprobante de Ana → Bruno | `404` (no revela que existe) |
| Número `OP-XYZ` | `404` |
| Comprobante abierto después de más operaciones | Muestra el saldo resultante de aquel momento, no el actual |
| Transferencia sin glosa | `glosa: null`; la interfaz omite la fila |
| Comprobante de una repetición idempotente | Es el mismo número; mismo comprobante |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-17.1 | CA-17.1 |
| R-17.2 | CA-17.2 |
| R-17.3 | CA-17.3 |
| R-17.4 | CA-17.4 |
| R-17.5 | CA-17.5 |

Criterios de HU-17 sin regla: **ninguno** (CA-17.1 a CA-17.5 cubiertos).
