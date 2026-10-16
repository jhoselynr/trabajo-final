# ADR-002 · Persistencia en memoria con semilla JSON y atomicidad de operaciones

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-001, ADR-004, ADR-006

## Contexto

La base de datos es opcional (§5): se puede usar memoria o archivos. A la vez se exige consistencia: "el débito y el registro de una operación ocurren juntos o no ocurren", y una transferencia afecta el saldo y el historial de **dos** usuarios. Los datos semilla (§4) son fijos y ficticios.

## Decisión

- **Almacenamiento en memoria** del proceso del backend (colecciones dentro de un `InMemoryStore` registrado como *singleton*).
- **Semilla JSON** versionada en `BilleRef.Infrastructure/Seed/`:
  - `usuarios.json` — celular, nombre, **hash del PIN** (nunca el PIN en claro, ver ADR-003), saldo inicial, estado.
  - `empresas.json` — servicios, empresas, códigos de cliente y deudas.
  - Se carga al iniciar la aplicación; reiniciar el backend restablece el estado inicial (útil para pruebas E2E repetibles).
- **Atomicidad:** cada operación que modifica saldos (transferencia o pago) se ejecuta dentro de una **sección crítica única** (`SemaphoreSlim(1,1)` global del store):
  1. Validar todas las reglas (saldo, límites, deuda más antigua, idempotencia) con los datos actuales.
  2. Calcular el nuevo estado (saldos, operación, deuda pagada).
  3. Aplicar todos los cambios juntos, sin puntos de fallo intermedios (sin E/S ni llamadas externas dentro de este paso).
  Si algo falla en los pasos 1–2, no se modifica nada.
- Una transferencia genera **un registro de operación** visible en el historial de ambos usuarios (enviada para el origen, recibida para el destino).
- Para facilitar las pruebas se expone un endpoint `POST /api/test/reset` **solo en el entorno `Development`**.

## Alternativas consideradas

- **SQLite:** transacciones ACID reales y datos que sobreviven reinicios; descartada para mantener el proyecto sin dependencias de base de datos.
- **SQL Server con estándar BCP:** obligaría a gestionar credenciales fuera del repositorio y aplicar el estándar BCP; excesivo para el alcance.
- **Archivos JSON como persistencia de escritura:** riesgo de corrupción ante escrituras concurrentes y sin atomicidad nativa.

## Consecuencias

- **Positivas:** cero infraestructura; arranque inmediato; estado reproducible para las pruebas.
- **Negativas:** los datos se pierden al reiniciar; un único proceso (no escala horizontalmente); el *lock* global serializa todas las operaciones de dinero (aceptable con pocos usuarios).
- **Mitigación:** el acceso a datos va detrás de interfaces (`IUsuarioRepository`, `IOperacionRepository`, `IDeudaRepository`), así que cambiar a SQLite o SQL Server más adelante no toca las reglas de negocio.
