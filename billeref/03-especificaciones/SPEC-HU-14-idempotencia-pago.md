# SPEC-HU-14 · Evitar el doble pago de una deuda

- **Historia:** [HU-14](../02-historias/HU-14-evitar-doble-pago.md) · **ADR:** 004, 006, 002

## 1. Reglas

- **R-14.1** El pago usa la misma mecánica de idempotencia que la transferencia (SPEC-HU-10: R-10.1 a R-10.9). → CA-14.1, CA-14.2
- **R-14.2** Huella del pago = SHA-256 (hex) de `"P|{empresaId}|{codigoCliente normalizado}|{periodo}"`, sin el PIN. → CA-14.2
- **R-14.3** La idempotencia se evalúa **antes** que el estado de la deuda: una repetición con la misma clave devuelve `200` con el comprobante original, no `DEUDA_YA_PAGADA`. → CA-14.1, CA-14.2
- **R-14.4** Un pago con otra clave sobre una deuda `PAGADA` responde `422 DEUDA_YA_PAGADA`, sin cambios. → CA-14.3
- **R-14.5** Una deuda `PAGADA` no aparece en la consulta de deudas. → CA-14.4
- **R-14.6** El estado de la deuda se verifica y cambia dentro de la sección crítica; dos pagos simultáneos con claves distintas producen un solo débito. → CA-14.5

## 2. Contratos

`POST /api/pagos` (SPEC-HU-13) con `Idempotency-Key`. Repetición → `200` con `Idempotent-Replayed: true` y el mismo `ComprobantePagoDto`.

Respuesta de deuda ya pagada:
```json
{ "status": 422, "codigo": "DEUDA_YA_PAGADA", "detail": "Esta deuda ya fue pagada" }
```

### Modelo de datos
- `ClaveIdempotencia` (SPEC-HU-10).
- `Deuda.estado`, `Deuda.numeroOperacionPago`.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `DEUDA_YA_PAGADA` | 422 | Esta deuda ya fue pagada | Otra clave sobre una deuda `PAGADA` |
| `IDEMPOTENCIA_CONFLICTO` | 422 | La solicitud no coincide con una operación anterior | Misma clave con otra deuda |
| `IDEMPOTENCIA_CLAVE_REQUERIDA` | 400 | No se pudo procesar la solicitud. Intenta nuevamente. | Falta la cabecera o no es UUID |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| Doble toque con la misma clave | `201` + `200` repetido; un solo débito de Bs 250,00 (NA-3003) |
| Dos pagos simultáneos de NA-3003 con claves distintas | Uno `201`, otro `422 DEUDA_YA_PAGADA`; saldo Bs 550,00 |
| Misma clave reutilizada para otra deuda (`AC-2002`) | `422 IDEMPOTENCIA_CONFLICTO` |
| Repetición con `codigoCliente` en minúsculas | Misma huella (código normalizado) → repetición |
| Clave vencida (24 h) sobre deuda ya pagada | Se procesa como nueva → `DEUDA_YA_PAGADA` (no hay doble pago) |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-14.1 | CA-14.1, CA-14.2 |
| R-14.2 | CA-14.2 |
| R-14.3 | CA-14.1, CA-14.2 |
| R-14.4 | CA-14.3 |
| R-14.5 | CA-14.4 |
| R-14.6 | CA-14.5 |

Criterios de HU-14 sin regla: **ninguno** (CA-14.1 a CA-14.5 cubiertos).
