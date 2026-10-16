# ADR-004 · Idempotencia de operaciones con `Idempotency-Key`

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-002, ADR-006

## Contexto

§3.3 exige que "una transferencia confirmada no se pueda duplicar por un doble envío: la misma solicitud reenviada no genera un segundo débito". §7 pregunta cómo se evita el doble débito ante un reintento. Un doble envío puede deberse a un doble toque, a un reintento automático del navegador o a una respuesta perdida por la red. El mismo riesgo existe en el pago de servicios.

## Decisión

- El frontend genera un **UUID v4** (`crypto.randomUUID()`) cuando el usuario llega a la pantalla de confirmación, y lo envía en la cabecera **`Idempotency-Key`** en `POST /api/transferencias` y `POST /api/pagos`. La misma clave se reutiliza en cualquier reintento de esa confirmación; se genera una nueva solo si el usuario inicia otra operación.
- El backend guarda en memoria, **por usuario**, el registro `{clave, hash del cuerpo de la solicitud, estado, respuesta}`:
  - **Clave nueva:** se procesa la operación dentro de la sección crítica (ADR-002) y se guarda la respuesta (éxito o error de negocio).
  - **Clave repetida con el mismo cuerpo:** se devuelve **la respuesta original** (mismo número de operación y comprobante), sin volver a debitar.
  - **Clave repetida con otro cuerpo:** `422 Unprocessable Entity` ("La solicitud no coincide con una operación anterior").
  - **Clave repetida mientras la original sigue en proceso:** `409 Conflict`; el cliente reintenta en breve.
  - **Sin cabecera:** `400 Bad Request`.
- El registro de la clave y la operación se escriben en la misma sección crítica, de modo que no puede quedar una operación sin su clave ni al revés.
- Las claves se conservan **24 horas**.
- Un PIN incorrecto **no** consume la clave: el usuario puede corregir el PIN y reenviar con la misma clave.
- Además, el botón "Confirmar" se deshabilita mientras la solicitud está en curso (defensa de interfaz, no la garantía principal).

## Alternativas consideradas

- **Detección por contenido + ventana de tiempo** (mismo origen, destino y monto en X segundos): puede rechazar dos transferencias legítimas e idénticas, y no distingue un reintento de una operación nueva.
- **Solo deshabilitar el botón:** no cubre reintentos de red ni respuestas perdidas.

## Consecuencias

- **Positivas:** garantía explícita y verificable de "a lo sumo un débito por confirmación"; el usuario recibe el mismo comprobante si reintenta.
- **Negativas:** estado adicional en memoria y lógica de limpieza de claves vencidas; el cliente debe administrar el ciclo de vida de la clave.
- **Pruebas:** un caso automatizado envía dos veces la misma solicitud con la misma clave y verifica un solo débito, el mismo número de operación y una sola entrada en el historial.
