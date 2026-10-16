# SPEC-HU-04 · Cierre de sesión por inactividad, recarga o voluntad del usuario

- **Historia:** [HU-04](../02-historias/HU-04-sesion-inactividad-y-cierre.md) · **ADR:** 003

## 1. Reglas

- **R-04.1** El frontend reinicia un temporizador de 5 minutos con cada interacción (`click`, `keydown`, `touchstart`, navegación). Al vencer: llama `POST /api/auth/logout`, descarta el token y navega al login con "Tu sesión se cerró por inactividad". → CA-04.1
- **R-04.2** Si hubo interacción desde la última renovación y al JWT le quedan menos de 60 s, el frontend llama `POST /api/auth/renovar` y reemplaza el token. → CA-04.2
- **R-04.3** Cada respuesta `2xx` a una petición autenticada incluye `X-Renewed-Token` con un JWT nuevo de 5 minutos (mismo `sid`); el *interceptor* lo reemplaza. → CA-04.2
- **R-04.4** El token vive solo en memoria; recargar la página lo pierde y el usuario ve el login. → CA-04.3
- **R-04.5** `POST /api/auth/logout` agrega el `sid` a `SesionRevocada` hasta su `exp`; cualquier petición posterior con ese token responde `401`. → CA-04.4
- **R-04.6** Toda ruta salvo `/login` tiene un *guard* que exige token en memoria; sin token, redirige al login. → CA-04.5
- **R-04.7** Ante cualquier `401` con código `SESION_EXPIRADA`, el frontend descarta el token y muestra el login con "Tu sesión expiró. Ingresa nuevamente." → CA-04.6
- **R-04.8** El backend valida `exp` con `ClockSkew = TimeSpan.Zero` (por defecto .NET tolera 5 minutos, lo que duplicaría la sesión). → CA-04.6

## 2. Contratos

### `POST /api/auth/renovar`
- Headers: `Authorization: Bearer <jwt vigente>`. Sin cuerpo.
- Response `200`: `{ "token": "eyJ...", "expiraEnSegundos": 300 }`.

### `POST /api/auth/logout`
- Headers: `Authorization: Bearer <jwt>`. Sin cuerpo.
- Response `204`. Es idempotente: con un token ya revocado o vencido también responde `204`.

### Cabecera de renovación
- `X-Renewed-Token: <jwt>` en toda respuesta `2xx` autenticada (incluye `renovar`).

### Modelo de datos
- `SesionRevocada { sid, expira }`; se purgan las entradas con `expira < ahora`.
- Claims del JWT: `sub`, `sid`, `iat`, `exp` (SPEC-HU-01).

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `SESION_EXPIRADA` | 401 | Tu sesión expiró. Ingresa nuevamente. | Token ausente, inválido, vencido o con `sid` revocado; usuario ya no `ACTIVO` |
| *(sin código, frontend)* | — | Tu sesión se cerró por inactividad | Temporizador de 5 min vencido |

## 4. Casos borde

| Caso | Resultado esperado |
|---|---|
| Petición con token vencido hace 1 s | `401` (sin tolerancia, R-04.8) |
| Dos peticiones en paralelo devuelven dos `X-Renewed-Token` | El frontend conserva el de `exp` mayor |
| Usuario escribe 6 min en un formulario sin peticiones | R-04.2 renueva antes de vencer; el envío funciona (CA-04.2) |
| Pestaña en segundo plano: el navegador congela los temporizadores | Al volver, el frontend compara la hora real con la última interacción; si pasaron ≥ 5 min, cierra la sesión |
| Dos pestañas abiertas | Cada una tiene su propia sesión (token en memoria, sin compartir) |
| `renovar` con `sid` revocado | `401 SESION_EXPIRADA` |
| Logout sin conexión | El frontend descarta el token igual y muestra el login; el token caduca solo a los 5 min |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-04.1 | CA-04.1 |
| R-04.2 | CA-04.2 |
| R-04.3 | CA-04.2 |
| R-04.4 | CA-04.3 |
| R-04.5 | CA-04.4 |
| R-04.6 | CA-04.5 |
| R-04.7 | CA-04.6 |
| R-04.8 | CA-04.6 |

Criterios de HU-04 sin regla: **ninguno** (CA-04.1 a CA-04.6 cubiertos).
