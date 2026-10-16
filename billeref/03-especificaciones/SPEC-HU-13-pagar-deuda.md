# SPEC-HU-13 · Pagar la deuda más antigua con comisión

- **Historia:** [HU-13](../02-historias/HU-13-pagar-deuda.md) · **ADR:** 002, 004, 005, 006

## 1. Reglas

- **R-13.1** La confirmación muestra empresa, código, periodo, monto, comisión (Bs 1,00) y total, tomados de la respuesta de la consulta (SPEC-HU-11); el frontend no calcula montos. → CA-13.1
- **R-13.2** Se paga una sola deuda, por su monto total. El monto se lee de `IDeudaRepository`; el cuerpo no tiene campo de monto y cualquier campo extra se ignora. → CA-13.2, CA-13.9
- **R-13.3** La deuda debe ser la pendiente más antigua del código (mismo orden que SPEC-HU-11); si no, `422 DEUDA_NO_ES_LA_MAS_ANTIGUA` con el periodo que corresponde. → CA-13.3, CA-13.4
- **R-13.4** El saldo debe ser ≥ `monto + 1.00`; si no, `422 SALDO_INSUFICIENTE`. → CA-13.5, CA-13.6
- **R-13.5** El PIN se verifica antes del lock, con el contador compartido de SPEC-HU-02. → CA-13.7
- **R-13.6** Se aplican juntos: débito de `monto + comisión`, deuda en `PAGADA` con `numeroOperacionPago`, y registro de la `Operacion`. Ante una excepción se restaura todo y se responde `500 ERROR_INTERNO`. → CA-13.2, CA-13.8
- **R-13.7** El comprobante incluye número de operación, fecha, empresa, código, periodo, monto, comisión, total y saldo resultante. → CA-13.2
- **R-13.8** El pago no suma al límite diario de transferencias. → CA-08.6
- **R-13.9** La validación del pago lee `IDeudaRepository` dentro de la sección crítica, sin pasar por el gateway ni aplicar timeout. → CA-13.2

**Orden completo en el backend:** pasos 1–5 del orden común (README) → **lock** → (7) idempotencia (SPEC-HU-14) → (8a) `ClienteServicio` existe → (8b) la deuda del periodo existe → (8c) está `PENDIENTE` → (8d) es la más antigua → (8e) saldo ≥ total → (9) aplicar → (10) guardar clave → `201`.

## 2. Contratos

### `POST /api/pagos`

Headers: `Authorization: Bearer <jwt>`, `Idempotency-Key: <uuid v4>`.

Request:
```json
{ "empresaId": "luz-del-valle", "codigoCliente": "LV-1001", "periodo": "2026-08", "pin": "1111" }
```

Response `201` (`ComprobantePagoDto`):
```json
{
  "numeroOperacion": "OP-20261015-000002",
  "fecha": "2026-10-15T14:35:00-04:00",
  "tipo": "PAGO_SERVICIO",
  "empresa": { "id": "luz-del-valle", "nombre": "Luz del Valle S.A." },
  "codigoCliente": "LV-1001",
  "periodo": "2026-08",
  "monto": "185.40",
  "comision": "1.00",
  "total": "186.40",
  "saldoResultante": "4813.60"
}
```

### Modelo de datos
- `Operacion` con `tipo = PAGO_SERVICIO`, `empresaId`, `codigoCliente`, `periodo`, `monto`, `comision`, `saldoResultanteOrigen`.
- `Deuda.estado`, `Deuda.numeroOperacionPago`.
- Constante `ComisionPago = 1.00m`.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `SOLICITUD_INVALIDA` | 400 | No se pudo procesar la solicitud | Campos ausentes, `empresaId` desconocido o periodo sin formato `AAAA-MM` |
| `PIN_INVALIDO` / `PIN_INCORRECTO` / `ACCESO_BLOQUEADO_TEMPORAL` | 400 / 422 / 401 | Ver SPEC-HU-02 | Ver SPEC-HU-02 |
| `CODIGO_CLIENTE_INEXISTENTE` | 422 | El código de cliente no existe en {empresa} | Código no existe en la empresa |
| `SOLICITUD_INVALIDA` | 400 | No se pudo procesar la solicitud | El código existe pero no tiene deuda de ese periodo |
| `DEUDA_YA_PAGADA` | 422 | Esta deuda ya fue pagada | Deuda en estado `PAGADA` (SPEC-HU-14) |
| `DEUDA_NO_ES_LA_MAS_ANTIGUA` | 422 | Paga primero el periodo {periodo} | Existe una deuda pendiente más antigua |
| `SALDO_INSUFICIENTE` | 422 | Saldo insuficiente | `saldo < monto + 1.00` |
| `ERROR_INTERNO` | 500 | Ocurrió un error. Tu saldo no fue modificado. Intenta nuevamente. | Excepción al aplicar |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| Saldo exacto `186.40` para LV-1001 2026-08 | Válido; saldo resultante Bs 0,00 |
| Saldo `64.00` para AC-2002 (`64.00 + 1.00`) | `SALDO_INSUFICIENTE` |
| Pagar 2026-09 de LV-1001 con 2026-08 pendiente | `DEUDA_NO_ES_LA_MAS_ANTIGUA`, "Paga primero el periodo 2026-08" |
| Pago de 2026-08 y enseguida 2026-09 de LV-1001 | Ambos válidos, en ese orden |
| Cuerpo con `"monto": "1.00"` | Se ignora; se debita `186.40` |
| Empresa en modo `LENTO` o `FALLA` | El pago funciona (R-13.9) |
| Usuario con 70000003 (Bs 0,00) | `SALDO_INSUFICIENTE` en cualquier deuda |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-13.1 | CA-13.1 |
| R-13.2 | CA-13.2, CA-13.9 |
| R-13.3 | CA-13.3, CA-13.4 |
| R-13.4 | CA-13.5, CA-13.6 |
| R-13.5 | CA-13.7 |
| R-13.6 | CA-13.2, CA-13.8 |
| R-13.7 | CA-13.2 |
| R-13.8 | CA-08.6 |
| R-13.9 | CA-13.2 |

Criterios de HU-13 sin regla: **ninguno** (CA-13.1 a CA-13.9 cubiertos).
