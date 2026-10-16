# SPEC-HU-03 · Ingreso de un usuario con cuenta bloqueada

- **Historia:** [HU-03](../02-historias/HU-03-cuenta-bloqueada.md) · **ADR:** 003

## 1. Reglas

- **R-03.1** Si el PIN es correcto y `Usuario.estado = BLOQUEADO`, se responde `403 CUENTA_BLOQUEADA` y no se emite JWT. → CA-03.1
- **R-03.2** Si el PIN es incorrecto, se responde `401 CREDENCIALES_INVALIDAS`, igual que a cualquier usuario: el estado no se revela. → CA-03.2
- **R-03.3** Los PIN incorrectos de una cuenta bloqueada acumulan intentos y producen el bloqueo temporal (SPEC-HU-02). → CA-03.3
- **R-03.4** Un PIN correcto de una cuenta bloqueada reinicia el contador de intentos. → CA-03.4
- **R-03.5** El bloqueo temporal tiene prioridad: si está vigente, se responde `423` antes de mirar el PIN o el estado. → CA-03.3
- **R-03.6** Una cuenta bloqueada no puede ser destinataria de transferencias (SPEC-HU-06). → CA-06.2

## 2. Contratos

Usa `POST /api/auth/login` (SPEC-HU-01). Respuesta específica:

```json
{ "status": 403, "codigo": "CUENTA_BLOQUEADA",
  "detail": "Tu cuenta está bloqueada. Comunícate con soporte." }
```

### Modelo de datos

- `Usuario.estado: ACTIVO | BLOQUEADO` (solo cambia por la semilla; no hay administración en el alcance).
- `IntentosAcceso` (SPEC-HU-02).

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `CUENTA_BLOQUEADA` | 403 | Tu cuenta está bloqueada. Comunícate con soporte. | PIN correcto y estado `BLOQUEADO` |
| `CREDENCIALES_INVALIDAS` | 401 | Celular o PIN incorrectos | PIN incorrecto (con cualquier estado) |
| `ACCESO_BLOQUEADO_TEMPORAL` | 423 | Demasiados intentos. Intenta nuevamente en X minutos. | Tercer fallo o bloqueo temporal vigente |

## 4. Casos borde

| Caso | Resultado esperado |
|---|---|
| 70000004 con bloqueo temporal vigente y PIN correcto | `423` (R-03.5), no `403` |
| 70000004 con PIN correcto repetido muchas veces | Siempre `403`; nunca se bloquea temporalmente |
| Token fabricado con el `sub` de 70000004 | Imposible sin la clave de firma; si existiera, toda petición autenticada verifica `estado = ACTIVO` y responde `401 SESION_EXPIRADA` |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-03.1 | CA-03.1 |
| R-03.2 | CA-03.2 |
| R-03.3 | CA-03.3 |
| R-03.4 | CA-03.4 |
| R-03.5 | CA-03.3 |
| R-03.6 | CA-06.2 |

Criterios de HU-03 sin regla: **ninguno** (CA-03.1 a CA-03.4 cubiertos).
