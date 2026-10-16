# SPEC-HU-09 · Confirmar la transferencia con PIN y obtener el comprobante

- **Historia:** [HU-09](../02-historias/HU-09-confirmar-transferencia.md) · **ADR:** 002, 003, 004, 005

## 1. Reglas

- **R-09.1** La pantalla de confirmación muestra destinatario enmascarado, monto con 2 decimales y glosa (si la hay), y pide el PIN. No se envía nada al backend hasta tocar "Confirmar". → CA-09.1
- **R-09.2** El PIN se verifica antes de entrar a la sección crítica. Si es incorrecto: `422 PIN_INCORRECTO` con `intentosRestantes`, sin cambios; el usuario puede reingresar el PIN en la misma pantalla con la misma `Idempotency-Key`. → CA-09.4
- **R-09.3** Dentro de la sección crítica, con todas las reglas aprobadas, se aplican juntos: débito al origen, crédito al destino y registro de la `Operacion`. → CA-09.2, CA-09.3
- **R-09.4** Si cualquier paso de la aplicación lanza una excepción, se restauran los saldos previos y no se registra la operación ni la clave; respuesta `500 ERROR_INTERNO`. → CA-09.6
- **R-09.5** Número de operación: `OP-` + fecha Bolivia `AAAAMMDD` + `-` + correlativo global de 6 dígitos con ceros a la izquierda. Solo se asigna a operaciones exitosas. → CA-09.2
- **R-09.6** El comprobante incluye número, fecha y hora Bolivia, destinatario enmascarado, monto, glosa y el saldo resultante del origen. → CA-09.2
- **R-09.7** La operación guarda `saldoResultanteOrigen` y `saldoResultanteDestino`; aparece en el historial de ambos, cada uno con su saldo. → CA-09.3
- **R-09.8** "Cancelar" vuelve al inicio sin enviar ninguna solicitud. → CA-09.5

**Orden completo en el backend:** pasos 1–5 del orden común (README) → **lock** → (7) idempotencia (SPEC-HU-10) → (8a) destinatario: no es uno mismo, existe y está `ACTIVO` (SPEC-HU-06) → (8b) límite diario (SPEC-HU-08) → (8c) saldo ≥ monto (SPEC-HU-07) → (9) aplicar → (10) guardar clave → `201`.
Las validaciones de formato del paso 3 incluyen: celular (SPEC-HU-06), monto y glosa (SPEC-HU-07) y límite por transferencia (SPEC-HU-08).

## 2. Contratos

### `POST /api/transferencias`

Headers: `Authorization: Bearer <jwt>`, `Idempotency-Key: <uuid v4>`.

Request:
```json
{ "celularDestino": "70000002", "monto": "150.50", "glosa": "Almuerzo", "pin": "1111" }
```

Response `201` (`ComprobanteTransferenciaDto`):
```json
{
  "numeroOperacion": "OP-20261015-000001",
  "fecha": "2026-10-15T14:30:00-04:00",
  "tipo": "TRANSFERENCIA_ENVIADA",
  "contraparte": { "rol": "DESTINATARIO", "nombreEnmascarado": "Bruno E*** M***" },
  "monto": "150.50",
  "glosa": "Almuerzo",
  "saldoResultante": "4849.50"
}
```

### Modelo de datos
- `Operacion` con `tipo = TRANSFERENCIA`, `usuarioOrigenId`, `usuarioDestinoId`, `monto`, `glosa`, `fechaUtc`, `saldoResultanteOrigen`, `saldoResultanteDestino`.
- `Usuario.saldo` de origen y destino.
- Notificación simulada (ADR-006): `INotificador` registra en el log `"Transferencia OP-... de ******01 a ******02 por 150.50"`, sin saldos.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `PIN_INVALIDO` | 400 | Ingresa un PIN de 4 dígitos | PIN sin formato de 4 dígitos |
| `PIN_INCORRECTO` | 422 | PIN incorrecto. Te quedan N intentos. | PIN incorrecto, intentos 1 y 2 |
| `ACCESO_BLOQUEADO_TEMPORAL` | 401 | Demasiados intentos. Intenta nuevamente en X minutos. | Tercer PIN incorrecto o bloqueo vigente |
| `DESTINATARIO_NO_DISPONIBLE` | 422 | El destinatario no está disponible | Ver SPEC-HU-06 |
| `TRANSFERENCIA_A_SI_MISMO` | 422 | No puedes transferirte a ti mismo | Ver SPEC-HU-06 |
| `LIMITE_POR_TRANSFERENCIA` / `LIMITE_DIARIO` | 422 | Ver SPEC-HU-08 | Ver SPEC-HU-08 |
| `MONTO_*`, `GLOSA_LARGA`, `SALDO_INSUFICIENTE` | 400 / 422 | Ver SPEC-HU-07 | Ver SPEC-HU-07 |
| `ERROR_INTERNO` | 500 | Ocurrió un error. Tu saldo no fue modificado. Intenta nuevamente. | Excepción al aplicar (R-09.4) |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| Transferir todo el saldo (`800.00` con Bs 800,00) | Válido; saldo resultante Bs 0,00 |
| Glosa `null` | El comprobante muestra la glosa como `null` y la interfaz la omite |
| Falla al registrar la operación después de debitar | Se restaura el saldo del origen y del destino (R-09.4) |
| Correlativo `999999` alcanzado | Fuera de alcance (una ejecución de prueba no llega); se documenta como límite conocido |
| Dos transferencias de usuarios distintos a la vez | Se serializan en el lock; ambas se procesan correctamente |
| Transferencia a las 23:59:59 Bolivia | El número usa la fecha Bolivia de ese día (`OP-20261015-...`) |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-09.1 | CA-09.1 |
| R-09.2 | CA-09.4 |
| R-09.3 | CA-09.2, CA-09.3 |
| R-09.4 | CA-09.6 |
| R-09.5 | CA-09.2 |
| R-09.6 | CA-09.2 |
| R-09.7 | CA-09.3 |
| R-09.8 | CA-09.5 |

Criterios de HU-09 sin regla: **ninguno** (CA-09.1 a CA-09.6 cubiertos).
