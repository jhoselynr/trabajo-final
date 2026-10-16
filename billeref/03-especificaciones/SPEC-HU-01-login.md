# SPEC-HU-01 · Iniciar sesión con celular y PIN

- **Historia:** [HU-01](../02-historias/HU-01-iniciar-sesion.md) · **ADR:** 003, 007

## 1. Reglas

- **R-01.1** Un celular y PIN correctos de un usuario `ACTIVO` sin bloqueo temporal emiten un JWT de 5 minutos y llevan a la pantalla de inicio. → CA-01.1
- **R-01.2** Un PIN incorrecto responde `401 CREDENCIALES_INVALIDAS` con el mensaje "Celular o PIN incorrectos", no emite sesión y suma un intento fallido (SPEC-HU-02). → CA-01.2
- **R-01.3** Un celular inexistente responde exactamente igual que un PIN incorrecto (mismo estado, código y mensaje). Para que el tiempo de respuesta tampoco lo delate, se verifica el PIN contra un hash ficticio. → CA-01.3
- **R-01.4** El celular debe cumplir `^\d{8}$`. El frontend no envía la solicitud si no cumple; el backend responde `400 CELULAR_INVALIDO`. → CA-01.4
- **R-01.5** El PIN debe cumplir `^\d{4}$`. El frontend deshabilita "Ingresar" mientras no cumpla; el backend responde `400 PIN_INVALIDO` y **no** cuenta un intento fallido. → CA-01.7
- **R-01.6** El campo PIN se muestra oculto (`type="password"`), con `inputmode="numeric"`, `maxlength="4"`, `autocomplete="off"`, y se vacía tras cada envío. → CA-01.5
- **R-01.7** Ni el PIN ni el celular completo aparecen en los logs; el celular se registra como `******01`. → CA-01.6
- **R-01.8** Un login exitoso reinicia a 0 el contador de intentos fallidos del celular. → CA-02.4
- **R-01.9** El frontend guarda el token solo en memoria (ni `localStorage` ni `sessionStorage`). → CA-04.3

**Orden de evaluación en el backend:** (1) formato de celular y PIN → `400`; (2) bloqueo temporal activo → `423` (SPEC-HU-02); (3) verificar PIN (hash real o ficticio); (4) PIN incorrecto o celular inexistente → suma intento, `401` o, si es el tercero, `423`; (5) estado `BLOQUEADO` → `403` (SPEC-HU-03); (6) éxito → reinicia contador y emite JWT.

## 2. Contratos

### `POST /api/auth/login` (sin autenticación)

Request:
```json
{ "celular": "70000001", "pin": "1111" }
```

Response `200`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiraEnSegundos": 300,
  "usuario": { "nombre": "Ana Ficticia Rojas" }
}
```

JWT (HS256): `sub` = `Usuario.id`, `sid` = Guid nuevo, `iat`, `exp` = `iat + 300`. No incluye celular, nombre ni saldo.

### Modelo de datos

- `Usuario`: `id`, `celular`, `nombre`, `pinHash` (PBKDF2 vía `PasswordHasher<Usuario>`), `estado`.
- `IntentosAcceso`: `celular`, `fallidosConsecutivos`, `bloqueadoHasta`.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `CELULAR_INVALIDO` | 400 | Ingresa un celular válido de 8 dígitos | El celular no cumple `^\d{8}$` |
| `PIN_INVALIDO` | 400 | Ingresa un PIN de 4 dígitos | El PIN no cumple `^\d{4}$` |
| `CREDENCIALES_INVALIDAS` | 401 | Celular o PIN incorrectos | PIN incorrecto o celular inexistente (intentos 1 y 2) |
| `ACCESO_BLOQUEADO_TEMPORAL` | 423 | Demasiados intentos. Intenta nuevamente en X minutos. | Tercer intento fallido o bloqueo vigente (SPEC-HU-02) |
| `CUENTA_BLOQUEADA` | 403 | Tu cuenta está bloqueada. Comunícate con soporte. | PIN correcto de un usuario `BLOQUEADO` (SPEC-HU-03) |

## 4. Casos borde

| Caso | Resultado esperado |
|---|---|
| Celular con espacios `"7000 0001"` | El frontend quita los espacios antes de validar; el backend no los quita y responde `400 CELULAR_INVALIDO` |
| Celular con prefijo `"+59170000001"` | `400 CELULAR_INVALIDO` |
| PIN `"0000"` | Formato válido; se verifica normalmente |
| PIN `"11"`, `"11111"`, `"abcd"` | `400 PIN_INVALIDO`, no suma intento |
| Celular inexistente | Mismo cuerpo, estado y tiempo aproximado que un PIN incorrecto |
| Doble toque en "Ingresar" | Botón deshabilitado durante la solicitud; si llegan dos, se emiten dos sesiones independientes (sin efecto sobre el dinero) |
| Cuerpo sin `pin` | `400 SOLICITUD_INVALIDA` |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-01.1 | CA-01.1 |
| R-01.2 | CA-01.2 |
| R-01.3 | CA-01.3 |
| R-01.4 | CA-01.4 |
| R-01.5 | CA-01.7 |
| R-01.6 | CA-01.5 |
| R-01.7 | CA-01.6 |
| R-01.8 | CA-02.4 |
| R-01.9 | CA-04.3 |

Criterios de HU-01 sin regla: **ninguno** (CA-01.1 a CA-01.7 cubiertos).
