# SPEC-HU-10 · Evitar el doble débito ante un doble envío

- **Historia:** [HU-10](../02-historias/HU-10-evitar-doble-transferencia.md) · **ADR:** 004, 002

## 1. Reglas

- **R-10.1** El frontend genera un UUID v4 (`crypto.randomUUID()`) cada vez que entra a la pantalla de confirmación y lo reutiliza en todo reintento de esa confirmación; volver atrás y cambiar datos genera uno nuevo. → CA-10.1, CA-10.4
- **R-10.2** La cabecera `Idempotency-Key` es obligatoria y debe ser un UUID; si falta o es inválida, `400 IDEMPOTENCIA_CLAVE_REQUERIDA` antes de verificar el PIN. → CA-10.7
- **R-10.3** Si para el mismo usuario existe una clave con operación exitosa y la misma huella, se responde `200` con el cuerpo original guardado (mismo número y saldo resultante de ese momento) y la cabecera `Idempotent-Replayed: true`, sin evaluar reglas ni debitar. → CA-10.1, CA-10.2
- **R-10.4** Si la clave existe con otra huella, `422 IDEMPOTENCIA_CONFLICTO`, sin cambios. → CA-10.3
- **R-10.5** Huella = SHA-256 (hex) de `"T|{celularDestino}|{monto con 2 decimales}|{glosa recortada o vacío}"`. **No incluye el PIN.** → CA-10.3
- **R-10.6** Solo se guardan claves de operaciones exitosas; un error (PIN, saldo, límite, etc.) no consume la clave. → CA-10.5
- **R-10.7** Las claves vencen a las 24 h de `creadaUtc`; una clave vencida se trata como nueva. Se purgan en cada acceso al almacén. → CA-10.8
- **R-10.8** El botón "Confirmar" se deshabilita desde el toque hasta recibir la respuesta. → CA-10.6
- **R-10.9** La búsqueda y el guardado de la clave ocurren dentro de la sección crítica; dos solicitudes con la misma clave nunca se procesan a la vez, así que la segunda siempre ve la primera ya terminada. → CA-10.1

## 2. Contratos

`POST /api/transferencias` (SPEC-HU-09) con la cabecera:

```
Idempotency-Key: 3f1c2a9e-7b6d-4e1f-9a2b-5c8d0e1f2a3b
```

Repetición con la misma clave y huella → `200`:
```
Idempotent-Replayed: true
```
```json
{ "numeroOperacion": "OP-20261015-000001", "...": "mismo cuerpo que el 201 original" }
```

### Modelo de datos
- `ClaveIdempotencia { usuarioId, clave, huella, respuesta, creadaUtc }`, indexada por `(usuarioId, clave)`.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `IDEMPOTENCIA_CLAVE_REQUERIDA` | 400 | No se pudo procesar la solicitud. Intenta nuevamente. | Falta la cabecera o no es UUID |
| `IDEMPOTENCIA_CONFLICTO` | 422 | La solicitud no coincide con una operación anterior | Clave usada con otros datos |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| Dos `POST` simultáneos con la misma clave | Uno `201`, el otro `200` con el mismo número; un solo débito |
| Misma clave, monto `"150.5"` y luego `"150.50"` | Misma huella (monto normalizado) → repetición |
| Misma clave, PIN correcto y luego PIN incorrecto | El PIN se verifica primero (orden común): `422 PIN_INCORRECTO` aunque la operación ya existiera |
| Misma clave usada por otro usuario | Independiente: las claves son por usuario |
| Primer intento con saldo insuficiente; recibe saldo; reintento con la misma clave | Se procesa y se realiza (los errores no consumen la clave) |
| Repetición después de que el saldo cambió | Devuelve el saldo resultante original, no el actual |
| Clave con 24 h y 1 s | Vencida: se procesa como nueva (otro débito) |
| Clave en minúsculas o mayúsculas | Se compara como `Guid`, sin importar mayúsculas |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-10.1 | CA-10.1, CA-10.4 |
| R-10.2 | CA-10.7 |
| R-10.3 | CA-10.1, CA-10.2 |
| R-10.4 | CA-10.3 |
| R-10.5 | CA-10.3 |
| R-10.6 | CA-10.5 |
| R-10.7 | CA-10.8 |
| R-10.8 | CA-10.6 |
| R-10.9 | CA-10.1 |

Criterios de HU-10 sin regla: **ninguno** (CA-10.1 a CA-10.8 cubiertos).
