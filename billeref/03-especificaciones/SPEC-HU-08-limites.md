# SPEC-HU-08 · Respetar los límites por transferencia y diario

- **Historia:** [HU-08](../02-historias/HU-08-limites-de-transferencia.md) · **ADR:** 002, 005

## 1. Reglas

- **R-08.1** `monto <= 3000.00`; si no, `422 LIMITE_POR_TRANSFERENCIA`. Se valida en el frontend y en el backend. → CA-08.1, CA-08.2
- **R-08.2** Un monto con más de 7 dígitos enteros se rechaza con `LIMITE_POR_TRANSFERENCIA` (evita desbordes al convertir). → CA-08.8
- **R-08.3** `acumuladoDelDia + monto <= 10000.00`; si no, `422 LIMITE_DIARIO` con el disponible (`10000.00 − acumuladoDelDia`). → CA-08.3, CA-08.4
- **R-08.4** El día es el calendario de Bolivia: `inicioDiaUtc = (fecha Bolivia de ahora) 00:00:00 −04:00`, `finDiaUtc = inicioDiaUtc + 24 h` (intervalo `[inicio, fin)`). → CA-08.5
- **R-08.5** `acumuladoDelDia` = suma de `Operacion.monto` con `tipo = TRANSFERENCIA`, `usuarioOrigenId = yo` y `fechaUtc` en el intervalo. No suman transferencias recibidas, pagos ni comisiones. → CA-08.6
- **R-08.6** Una transferencia que supera el límite se rechaza completa; nunca se transfiere una parte. → CA-08.4
- **R-08.7** R-08.3 se evalúa dentro de la sección crítica, después de la idempotencia y antes de aplicar, para que dos transferencias simultáneas no superen el límite. → CA-08.7

## 2. Contratos

Sin endpoint propio: reglas de `POST /api/transferencias` (SPEC-HU-09).

Respuesta de límite diario:
```json
{ "status": 422, "codigo": "LIMITE_DIARIO",
  "detail": "Superas el límite diario de Bs 10.000. Disponible hoy: Bs 1.000,00",
  "disponibleHoy": "1000.00" }
```

### Modelo de datos
- Constantes de dominio: `LimitePorTransferencia = 3000.00m`, `LimiteDiario = 10000.00m`, `ZonaBolivia = TimeSpan.FromHours(-4)`.
- `Operacion.fechaUtc`, `Operacion.monto`, `Operacion.usuarioOrigenId`, `Operacion.tipo`.
- Reloj: `TimeProvider`.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `LIMITE_POR_TRANSFERENCIA` | 422 | El monto máximo por transferencia es Bs 3.000,00 | `monto > 3000.00` o más de 7 dígitos enteros |
| `LIMITE_DIARIO` | 422 | Superas el límite diario de Bs 10.000. Disponible hoy: Bs X | `acumulado + monto > 10000.00` |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| `3000.00` | Válido |
| `3000.01` | `LIMITE_POR_TRANSFERENCIA` |
| `12345678` | `LIMITE_POR_TRANSFERENCIA` |
| Acumulado `9000.00` + `1000.00` | Válido (llega exacto a 10.000,00) |
| Acumulado `9000.00` + `1000.01` | `LIMITE_DIARIO`, disponible Bs 1.000,00 |
| Acumulado `9999.99` + `0.01` | Válido |
| Acumulado `10000.00` + `0.01` | `LIMITE_DIARIO`, disponible Bs 0,00 |
| Transferencia a las 23:59:59 Bolivia (03:59:59 UTC del día siguiente) | Cuenta para el día que termina |
| Transferencia a las 00:00:00 Bolivia (04:00:00 UTC) | Cuenta para el día nuevo |
| Acumulado `8000.00`, dos de `1500.00` simultáneas | Una se realiza; la otra `LIMITE_DIARIO`, disponible Bs 500,00 |
| Supera a la vez el límite diario y el saldo | Responde `LIMITE_DIARIO` (orden en SPEC-HU-09) |
| Transferencia rechazada por cualquier motivo | No suma al acumulado |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-08.1 | CA-08.1, CA-08.2 |
| R-08.2 | CA-08.8 |
| R-08.3 | CA-08.3, CA-08.4 |
| R-08.4 | CA-08.5 |
| R-08.5 | CA-08.6 |
| R-08.6 | CA-08.4 |
| R-08.7 | CA-08.7 |

Criterios de HU-08 sin regla: **ninguno** (CA-08.1 a CA-08.8 cubiertos).
