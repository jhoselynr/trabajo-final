# Registro de decisiones de arquitectura (ADR) · BilleRef

Fuente: [`03-especificaciones/especificaciones-iniciales.md.txt`](../03-especificaciones/especificaciones-iniciales.md.txt).
Formato: una decisión por archivo (Contexto · Decisión · Alternativas · Consecuencias).

| N.º | Título | Estado | Fecha |
|---|---|---|---|
| [ADR-001](ADR-001-stack-y-arquitectura.md) | Stack y arquitectura: Angular (web móvil/PWA) + .NET 8 Web API | Aceptado | 2026-10-15 |
| [ADR-002](ADR-002-persistencia-en-memoria.md) | Persistencia en memoria con semilla JSON y atomicidad de operaciones | Aceptado | 2026-10-15 |
| [ADR-003](ADR-003-autenticacion-pin-y-sesion.md) | Autenticación con PIN, bloqueo por intentos y sesión con JWT corto | Aceptado | 2026-10-15 |
| [ADR-004](ADR-004-idempotencia.md) | Idempotencia de operaciones con `Idempotency-Key` | Aceptado | 2026-10-15 |
| [ADR-005](ADR-005-montos-fechas-y-limite-diario.md) | Montos con `decimal`, hora de Bolivia y cálculo del límite diario | Aceptado | 2026-10-15 |
| [ADR-006](ADR-006-integracion-empresas-de-servicios.md) | Integración simulada con empresas de servicios: timeout y reintento | Aceptado | 2026-10-15 |
| [ADR-007](ADR-007-logs-y-datos-sensibles.md) | Logs y enmascaramiento de datos sensibles | Aceptado | 2026-10-15 |
| [ADR-008](ADR-008-estrategia-de-pruebas.md) | Estrategia de pruebas: xUnit + Jest + Playwright MCP | Aceptado | 2026-10-15 |

> **Revisión de consistencia (2026-10-15):** se revisaron los 8 ADR entre sí para usarlos como base de generación de código. Si dos textos parecen chocar, manda el ADR más específico del tema (p. ej. el orden de procesamiento está en ADR-002 y la idempotencia en ADR-004).

## Respuestas a las preguntas de la sección 7

| Pregunta | Respuesta | ADR |
|---|---|---|
| ¿Cómo se calcula el "día" para el límite diario? | Día calendario en hora de Bolivia (00:00:00–23:59:59, UTC−4). Suma solo transferencias **enviadas** y **exitosas**. | ADR-005 |
| ¿Qué pasa si la consulta de deudas falla o tarda? | Timeout de 10 s por intento y 1 reintento automático en el backend; si vuelve a fallar, mensaje "Servicio no disponible" y reintento manual. Nunca se debita. | ADR-006 |
| ¿Cómo evitan el doble débito ante un reintento? | `Idempotency-Key` (UUID) generada por el cliente por cada confirmación; el backend devuelve el mismo comprobante si la clave se repite. | ADR-004 |
| ¿Qué ve el usuario bloqueado (70000004)? | Con PIN correcto: "Tu cuenta está bloqueada. Comunícate con soporte." Con PIN incorrecto: el mismo error genérico de credenciales. | ADR-003 |

## Supuestos transversales

Decisiones menores que la especificación no define y que se asumen aquí (se pueden convertir en ADR si cambian):

- **S-01.** Número de operación con formato `OP-AAAAMMDD-NNNNNN` (fecha Bolivia + correlativo global de 6 dígitos).
- **S-02.** Enmascaramiento del nombre: primer nombre completo; los demás nombres y apellidos muestran la inicial seguida de `***` ("Ana Ficticia Rojas" → "Ana F\*\*\* R\*\*\*").
- **S-03.** Un destinatario no activo o inexistente produce el mismo mensaje: "El destinatario no está disponible" (no se revela el motivo).
- **S-04.** *(Confirmado)* El límite por transferencia (Bs 3.000) y el diario (Bs 10.000) son inclusivos: se permite exactamente Bs 3.000 y el total transferido en el día puede llegar como máximo a Bs 10.000,00; cualquier transferencia que lo supere se rechaza.
- **S-05.** La comisión de Bs 1,00 no cuenta para el límite diario (que solo aplica a transferencias).
- **S-06.** La glosa se recorta de espacios al inicio y al final antes de validar los 60 caracteres.
- **S-07.** Las notificaciones se simulan con un registro en el log (enmascarado) y no se muestran al usuario.
- **S-08.** *(Confirmado)* Recargar la página cierra la sesión: el usuario debe volver a ingresar con celular y PIN (ADR-003).
