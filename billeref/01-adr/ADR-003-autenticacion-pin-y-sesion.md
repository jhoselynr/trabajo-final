# ADR-003 · Autenticación con PIN, bloqueo por intentos y sesión con JWT corto

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-001, ADR-002, ADR-007

## Contexto

§3.1 y §5 exigen:
- Ingreso con número de celular y PIN de 4 dígitos.
- 3 intentos fallidos seguidos bloquean el acceso 5 minutos.
- La sesión se cierra tras 5 minutos sin actividad.
- El PIN nunca se muestra, no se guarda en texto plano, va con hash y nunca aparece en logs.
- Nada de secretos en el repositorio.

Además, el usuario 70000004 tiene estado **Bloqueado** en la semilla, y las operaciones se confirman con el PIN.

## Decisión

### Almacenamiento del PIN
- Hash con **PBKDF2** (`PasswordHasher<T>` de ASP.NET Core Identity: HMAC-SHA512, sal aleatoria por usuario, 100.000+ iteraciones).
- `usuarios.json` contiene solo los hashes; se generan una vez con una pequeña herramienta de consola (`tools/HashPin`). Los PIN en claro solo existen en el documento de especificaciones como datos de prueba.
- En el frontend el campo PIN es `type="password"`, `inputmode="numeric"`, `maxlength="4"`, `autocomplete="off"`, y se borra del estado tras enviarse.

### Bloqueo por intentos (bloqueo temporal)
- Contador **por número de celular**, en memoria.
- **El contador es compartido entre el login y la confirmación de operaciones:** 3 PIN incorrectos seguidos, en cualquiera de los dos puntos, bloquean el acceso 5 minutos y, si había sesión, la cierran.
- Un PIN correcto reinicia el contador.
- Mientras dura el bloqueo temporal, todo intento de login responde: "Demasiados intentos. Intenta nuevamente en X minutos." (sin validar el PIN).
- Para un celular inexistente se responde el mismo error genérico de credenciales, y **también cuenta para el bloqueo temporal** de ese número. Así un celular inexistente se comporta exactamente igual que uno existente con PIN incorrecto y no se revela qué celulares existen.
- Mensajes exactos: credenciales erróneas → "Celular o PIN incorrectos" (`401`, código `CREDENCIALES_INVALIDAS`); bloqueo temporal → "Demasiados intentos. Intenta nuevamente en X minutos." (`423`, código `ACCESO_BLOQUEADO_TEMPORAL`).
- En la **confirmación** de una operación, un PIN incorrecto responde `422` con código `PIN_INCORRECTO` e indica los intentos restantes; el tercero responde `401` con código `ACCESO_BLOQUEADO_TEMPORAL`, revoca la sesión y el frontend vuelve al login.

### Usuario con estado Bloqueado (70000004)
- Se valida primero el PIN:
  - **PIN correcto:** "Tu cuenta está bloqueada. Comunícate con soporte." (`403`, código `CUENTA_BLOQUEADA`). No se emite sesión y el contador de intentos se reinicia.
  - **PIN incorrecto:** el mismo error genérico de credenciales que cualquier otro usuario ("Celular o PIN incorrectos"), y cuenta para el bloqueo temporal.
- Un usuario bloqueado tampoco puede ser destinatario de transferencias ("El destinatario no está disponible").

### Sesión: JWT corto con renovación
- Al iniciar sesión se emite un **JWT firmado (HS256) con expiración de 5 minutos**, con *claims* `sub` (id interno del usuario, no el celular) y `sid` (id de sesión).
- **Definición de actividad:** cualquier interacción del usuario en la interfaz (toque, tecla, navegación). El frontend es quien mide la inactividad; el backend solo hace cumplir la expiración del token.
- **Expiración deslizante:** cada respuesta exitosa a una petición autenticada devuelve un JWT renovado (cabecera `X-Renewed-Token`), que el frontend reemplaza.
- **Renovación por actividad sin peticiones:** si el usuario está activo (p. ej. escribiendo un formulario) pero no hay peticiones y al token le queda menos de 1 minuto, el frontend llama a `POST /api/auth/renovar`. Así el token no vence mientras el usuario sigue usando la app.
- **Inactividad en el cliente:** Angular reinicia un temporizador de 5 minutos con cada interacción; al vencer, llama a `POST /api/auth/logout`, descarta el token y redirige al login con el mensaje "Tu sesión se cerró por inactividad".
- **Respaldo en el servidor:** si no llega ninguna petición en 5 minutos (p. ej. la pestaña se cerró), el token expira y el backend responde `401`; el frontend trata cualquier `401` volviendo al login.
- **Revocación:** el backend mantiene en memoria la lista de `sid` revocados (logout o bloqueo temporal por PIN) hasta que expiran; así el logout y el bloqueo cierran la sesión de inmediato aunque el JWT siga vigente. `POST /api/auth/renovar` también rechaza un `sid` revocado.
- El token se guarda **solo en memoria** (servicio Angular), no en `localStorage` ni `sessionStorage`. **Recargar la página cierra la sesión y exige volver a ingresar** con celular y PIN (requisito confirmado).
- **Clave de firma:** fuera del repositorio — `dotnet user-secrets` en desarrollo y variable de entorno `BILLEREF_JWT_KEY` en otros entornos. Si falta, la aplicación no arranca.

## Alternativas consideradas

- **Token opaco con sesión en el servidor:** cierre de sesión trivial y sin clave de firma, pero el equipo prefirió JWT por ser el estándar más habitual en APIs.
- **Contadores separados para login y confirmación:** permitiría adivinar el PIN desde una sesión abierta sin bloquear el acceso.
- **Informar el bloqueo de 70000004 sin pedir PIN:** más claro, pero revela que la cuenta existe.

## Consecuencias

- **Positivas:** el PIN nunca se almacena ni viaja de vuelta en claro; el bloqueo protege también la confirmación; la sesión expira por inactividad tanto en cliente como en servidor.
- **Negativas:** el JWT exige gestionar una clave secreta y una lista de revocación (que reintroduce estado en el servidor); la renovación por cabecera agrega lógica en un *interceptor* de Angular.
- **Riesgo aceptado:** un PIN de 4 dígitos solo tiene 10.000 combinaciones; un hash no lo protege ante un robo del archivo de semilla. La defensa real es el bloqueo por intentos y no exponer la semilla. Es aceptable porque los datos son ficticios.
- Todas las comunicaciones deben ir por **HTTPS** (certificado de desarrollo de .NET en local).
