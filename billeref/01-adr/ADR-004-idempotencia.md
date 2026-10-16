# ADR-004 · Idempotencia de operaciones con `Idempotency-Key`

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-002, ADR-006

## Contexto

§3.3 exige que "una transferencia confirmada no se pueda duplicar por un doble envío: la misma solicitud reenviada no genera un segundo débito". §7 pregunta cómo se evita el doble débito ante un reintento. Un doble envío puede deberse a un doble toque, a un reintento automático del navegador o a una respuesta perdida por la red. El mismo riesgo existe en el pago de servicios.

## Decisión

### Ciclo de vida de la clave (frontend)
- El frontend genera un **UUID v4** (`crypto.randomUUID()`) **cada vez que entra a la pantalla de confirmación** con unos datos concretos, y lo envía en la cabecera **`Idempotency-Key`** en `POST /api/transferencias` y `POST /api/pagos`.
- La misma clave se reutiliza en todo reintento de **esa** confirmación: doble toque, error de red, timeout del navegador o reingreso del PIN tras un `PIN_INCORRECTO`.
- Si el usuario vuelve atrás para cambiar datos (monto, destinatario, glosa, deuda), al volver a la confirmación se genera una **clave nueva**.

### Tratamiento en el backend
- El backend guarda en memoria, **por usuario**, el registro `{clave, huella de la solicitud, respuesta exitosa}`.
- La **huella** es un SHA-256 de los campos de negocio de la solicitud **sin el PIN** (transferencia: celular destino, monto, glosa; pago: empresaId, codigoCliente, periodo). El PIN nunca forma parte de lo que se guarda.
- Solo se guardan las operaciones **exitosas**. Un error (PIN incorrecto, saldo insuficiente, límite, deuda ya pagada, etc.) **no consume la clave**: no se registra nada y el mismo reintento se vuelve a evaluar con los datos del momento.
- La búsqueda de la clave se hace **dentro de la sección crítica** (orden de ADR-002, paso 2.1), y la clave se guarda junto con la operación en el mismo paso de aplicación. Como dos solicitudes con la misma clave nunca se procesan a la vez, no existe un estado "en proceso".
- Respuestas:
  - **Clave sin operación exitosa previa:** se procesa normalmente.
  - **Clave repetida con la misma huella:** `200` con **la respuesta original** (mismo número de operación y comprobante), sin volver a debitar ni volver a validar reglas.
  - **Clave repetida con otra huella:** `422` con código `IDEMPOTENCIA_CONFLICTO` ("La solicitud no coincide con una operación anterior").
  - **Sin cabecera o con un valor que no es un UUID:** `400`.
- El PIN se verifica siempre antes (ADR-002, paso 1), incluso en un reintento de una operación ya exitosa.
- Las claves se conservan **24 horas** y luego se eliminan.
- Además, el botón "Confirmar" se deshabilita mientras la solicitud está en curso (defensa de interfaz, no la garantía principal).

## Alternativas consideradas

- **Detección por contenido + ventana de tiempo** (mismo origen, destino y monto en X segundos): puede rechazar dos transferencias legítimas e idénticas, y no distingue un reintento de una operación nueva.
- **Solo deshabilitar el botón:** no cubre reintentos de red ni respuestas perdidas.

## Consecuencias

- **Positivas:** garantía explícita y verificable de "a lo sumo un débito por confirmación"; el usuario recibe el mismo comprobante si reintenta.
- **Negativas:** estado adicional en memoria y lógica de limpieza de claves vencidas; el cliente debe administrar el ciclo de vida de la clave.
- **Matiz aceptado:** como los errores no consumen la clave, un reintento con la misma clave después de un error puede tener éxito si cambiaron las condiciones (p. ej. el usuario recibió saldo). Es el comportamiento deseado: sigue habiendo como máximo un débito por clave.
- **Pruebas:** un caso automatizado envía dos veces la misma solicitud con la misma clave y verifica un solo débito, el mismo número de operación y una sola entrada en el historial.
