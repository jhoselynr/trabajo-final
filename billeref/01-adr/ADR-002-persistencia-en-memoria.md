# ADR-002 · Persistencia en memoria con semilla JSON y atomicidad de operaciones

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-001, ADR-004, ADR-006

## Contexto

La base de datos es opcional (§5): se puede usar memoria o archivos. A la vez se exige consistencia: "el débito y el registro de una operación ocurren juntos o no ocurren", y una transferencia afecta el saldo y el historial de **dos** usuarios. Los datos semilla (§4) son fijos y ficticios.

## Decisión

- **Almacenamiento en memoria** del proceso del backend (colecciones dentro de un `InMemoryStore` registrado como *singleton*).
- **Semilla JSON** versionada en `BilleRef.Infrastructure/Seed/`:
  - `usuarios.json` — **id interno** (GUID fijo, usado como `sub` del JWT en ADR-003), celular, nombre, **hash del PIN** (nunca el PIN en claro, ver ADR-003), saldo inicial, estado (`ACTIVO` | `BLOQUEADO`).
  - `empresas.json` — servicios, empresas (con id), códigos de cliente y deudas (periodo, monto, vencimiento, estado `PENDIENTE` | `PAGADA`).
  - Se carga al iniciar la aplicación; reiniciar el backend restablece el estado inicial (útil para pruebas E2E repetibles).
- **Única fuente de verdad:** saldos, operaciones y **estado de las deudas** viven solo en el `InMemoryStore`, detrás de `IUsuarioRepository`, `IOperacionRepository` e `IDeudaRepository`. El mock de empresas (ADR-006) lee las deudas de `IDeudaRepository`; no guarda una copia propia.
- **Orden de procesamiento** de una transferencia o pago (`POST /api/transferencias`, `POST /api/pagos`):
  1. **Fuera del lock:** autenticación JWT, validaciones de formato (ADR-005) y verificación del PIN (ADR-003). El hash PBKDF2 es lento y no debe retener el lock.
  2. **Dentro de una sección crítica única** (`SemaphoreSlim(1,1)` global del store):
     1. Buscar la `Idempotency-Key` (ADR-004); si ya existe una operación exitosa con ella, devolver su respuesta y terminar.
     2. Validar todas las reglas de negocio con los datos actuales (saldo, límites, destinatario activo, deuda pendiente y más antigua).
     3. Calcular el nuevo estado (saldos, operación, deuda pagada, clave de idempotencia).
     4. Aplicar todos los cambios juntos, sin E/S, sin `await` y sin llamadas externas en este paso.
  Si algo falla antes del paso 2.4, no se modifica nada.
- Una transferencia genera **un registro de operación** visible en el historial de ambos usuarios (enviada para el origen, recibida para el destino). El registro guarda **el saldo resultante de cada parte por separado** (`saldoResultanteOrigen`, `saldoResultanteDestino`), y cada usuario solo ve el suyo en el comprobante: el destinatario nunca ve el saldo del que envía.
- Para facilitar las pruebas se expone un endpoint `POST /api/test/reset` **solo en el entorno `Development`**. Restablece todo el estado en memoria: saldos, operaciones, deudas, contadores de bloqueo, sesiones revocadas, claves de idempotencia y comportamiento del mock de empresas.

## Alternativas consideradas

- **SQLite:** transacciones ACID reales y datos que sobreviven reinicios; descartada para mantener el proyecto sin dependencias de base de datos.
- **SQL Server con estándar BCP:** obligaría a gestionar credenciales fuera del repositorio y aplicar el estándar BCP; excesivo para el alcance.
- **Archivos JSON como persistencia de escritura:** riesgo de corrupción ante escrituras concurrentes y sin atomicidad nativa.

## Consecuencias

- **Positivas:** cero infraestructura; arranque inmediato; estado reproducible para las pruebas.
- **Negativas:** los datos se pierden al reiniciar; un único proceso (no escala horizontalmente); el *lock* global serializa todas las operaciones de dinero (aceptable con pocos usuarios).
- **Mitigación:** el acceso a datos va detrás de interfaces (`IUsuarioRepository`, `IOperacionRepository`, `IDeudaRepository`), así que cambiar a SQLite o SQL Server más adelante no toca las reglas de negocio.
