# ADR-007 · Logs y enmascaramiento de datos sensibles

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-003, ADR-006

## Contexto

§3.1 y §5 exigen que los logs no incluyan el PIN, los saldos completos ni los números de celular completos, y que no haya secretos en el repositorio.

## Decisión

- Se usa el `ILogger` de .NET con **logs estructurados** (salida a consola en desarrollo).
- **Nunca se registra:**
  - el PIN, ni los cuerpos completos de las solicitudes `login`, `transferencias` y `pagos`;
  - el JWT ni la clave de firma;
  - saldos (ni antes ni después de una operación).
- **Se registra enmascarado:**
  - celular: solo los 2 últimos dígitos → `******01`;
  - nombre: formato enmascarado de S-02 (`Ana F*** R***`);
  - código de cliente de servicios: solo prefijo y 2 últimos caracteres → `LV-**01`.
- **Sí se registra:** número de operación, tipo, monto de la operación, resultado (éxito o código de error de negocio), `sid` de la sesión y un `traceId` de correlación.
- Las funciones de enmascaramiento viven en `BilleRef.Domain` (`Mascaras.Celular()`, `Mascaras.Nombre()`, `Mascaras.CodigoCliente()`) y se usan en todo el código; está prohibido interpolar valores sensibles directamente en los mensajes del log.
- **No se usa `UseHttpLogging`.** La categoría `Microsoft.AspNetCore` queda en nivel `Warning` en `appsettings.json`, para que ASP.NET no escriba las URLs de cada solicitud. Como refuerzo, ningún dato sensible viaja en la URL (ADR-001).
- Nunca se registran las cabeceras `Authorization`, `X-Renewed-Token` ni `Idempotency-Key`.
- Los errores no controlados devuelven al cliente un mensaje genérico y un `traceId`, nunca la traza de la excepción.
- `.gitignore` excluye `appsettings.*.local.json`, `.env` y `secrets.json`; los secretos se manejan según ADR-003.

## Alternativas consideradas

- **Serilog con *destructuring policies*** para enmascarar automáticamente: más robusto, pero agrega una dependencia; se puede adoptar más adelante sin cambiar las funciones de máscara.

## Consecuencias

- **Positivas:** cumplimiento verificable de §5; los logs siguen siendo útiles para rastrear operaciones por número y `traceId`.
- **Negativas:** depende de la disciplina del equipo; se mitiga con una prueba automatizada que ejecuta los flujos principales, captura los logs y verifica que no aparezcan los PIN ni los celulares completos de la semilla.
