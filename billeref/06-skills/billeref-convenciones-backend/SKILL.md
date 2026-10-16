---
name: billeref-convenciones-backend
description: Convenciones y principios de código limpio para el backend de BilleRef (ASP.NET Core .NET 10, C#). Usar al crear o modificar cualquier código en 05-desarrollo/backend — controladores, dominio, repositorios, validadores, middleware, el pipeline de operaciones de dinero o la integración simulada con empresas — para que respete los ADR y las especificaciones.
---

# Convenciones del backend de BilleRef

Fuente de verdad: `01-adr/`, `03-especificaciones/README.md` (modelo de datos, DTO, orden de procesamiento) y la `SPEC-HU-HH` de la historia que se implementa. Si el código necesita algo que la SPEC no dice o contradice, **se pregunta y se actualiza la SPEC primero**; no se decide en silencio.

## Arquitectura y dependencias

```
BilleRef.Api ──► BilleRef.Domain ◄── BilleRef.Infrastructure
     └──────────────────────────────────────┘
```

- **Domain** no depende de nada (ni de ASP.NET, ni de JSON, ni de Infrastructure). Contiene entidades, reglas, validadores, `Mascaras`, constantes y las interfaces (`IUsuarioRepository`, `IOperacionRepository`, `IDeudaRepository`, `IEmpresaServiciosGateway`, `INotificador`).
- **Infrastructure** implementa esas interfaces: `InMemoryStore`, repositorios, carga de `Seed/`, `EmpresaServiciosMock`, `NotificadorLog`.
- **Api** compone todo: controladores delgados, DTO, middleware de errores, filtro de `X-Renewed-Token`, endpoints de prueba (solo `Development`).
- El `InMemoryStore` es la **única** fuente de verdad de saldos, operaciones y estado de las deudas (ADR-002). Nadie guarda copias.

## Principios de código limpio aplicados

- **Responsabilidad única.** Un controlador solo traduce HTTP ↔ caso de uso; la regla vive en Domain. Un validador valida una cosa (`ValidadorMonto`, `ValidadorGlosa`).
- **Nombres del dominio en español, iguales a las SPEC:** `Usuario`, `Operacion`, `Deuda`, `ClienteServicio`, `saldoResultanteOrigen`, `numeroOperacion`. Sufijos técnicos convencionales: `Controller`, `Repository`, `Dto`, `Tests`. No mezclar sinónimos (no `Transaction` para `Operacion`).
- **Sin números mágicos:** `LimitePorTransferencia = 3000.00m`, `LimiteDiario = 10000.00m`, `ComisionPago = 1.00m`, `MaxGlosa = 60`, `MinutosBloqueo = 5`, `IntentosMaximos = 3`, `DuracionSesion = 5 min`, `VigenciaClave = 24 h`, `ZonaBolivia = −4 h`, en una clase de constantes del dominio.
- **Códigos y mensajes de error en un solo lugar** (`CodigosError` + mensajes del catálogo de `02-historias/README.md`, textualmente). Nunca un literal de error en un controlador.
- **Cláusulas de guarda** y retornos tempranos en lugar de `if` anidados; métodos cortos que se leen como la regla de la SPEC.
- **Inmutabilidad:** DTO y valores como `record`; las entidades solo se modifican en el paso de aplicación del pipeline.
- **Comentarios:** solo el ID de la regla cuando no sea obvio por el nombre (`// R-08.3`) o el porqué de una decisión no evidente. Nada de comentarios que repiten el código.
- **Sin código muerto ni "por si acaso":** solo lo que pide una regla o un criterio.

## Reglas obligatorias (ADR y SPEC)

### Dinero (ADR-005, SPEC-HU-07/08)
- Siempre `decimal`; nunca `double` ni `float`.
- En los DTO, montos como `string` con punto y 2 decimales en respuestas (`"185.40"`); con signo en movimientos (`"-150.50"`).
- Parseo con `CultureInfo.InvariantCulture`. Más de 2 decimales se **rechaza** (`MONTO_DECIMALES`), nunca se redondea.
- El monto de un pago se lee del repositorio; los campos extra del cuerpo se ignoran (R-13.2).

### Tiempo (ADR-005)
- `TimeProvider` inyectado en todo; **prohibido** `DateTime.Now`, `DateTime.UtcNow` y `DateTimeOffset.Now`.
- Se guarda en UTC; Bolivia es −04:00 fijo. Las respuestas llevan el desplazamiento (`2026-10-15T14:30:00-04:00`).

### Operaciones de dinero (README de SPEC, ADR-002, ADR-004)
- Transferencias y pagos pasan **por el mismo pipeline** (T-17), con el orden de 10 pasos del README. No duplicarlo.
- La verificación del PIN (PBKDF2) va **fuera** del lock.
- Dentro del `SemaphoreSlim(1,1)` global: idempotencia → reglas → aplicar → guardar clave. En el paso de aplicación **no hay `await`, E/S ni llamadas al gateway**; ante una excepción se restauran los valores previos.
- Huella de idempotencia SHA-256 **sin el PIN**; solo los éxitos guardan clave; repetición → `200` + `Idempotent-Replayed: true`.

### Sesión y seguridad (ADR-003, ADR-007)
- JWT HS256 con `sub` (id interno) y `sid`; `ClockSkew = TimeSpan.Zero`; `sid` revocados en memoria.
- La clave JWT se lee de *user-secrets* o `BILLEREF_JWT_KEY`; sin ella la app no arranca. Nunca en `appsettings.json`.
- Celular, código de cliente y PIN solo en cuerpos `POST`, nunca en rutas ni *query strings*.
- Logs estructurados con `ILogger`; datos personales siempre con `Mascaras.*`; nunca PIN, saldos, JWT ni cabeceras `Authorization`, `X-Renewed-Token` o `Idempotency-Key`. Sin `UseHttpLogging`; `Microsoft.AspNetCore` en `Warning`.
- Respuestas que no revelan existencia: celular inexistente = PIN incorrecto; comprobante ajeno o inexistente = `404`.

### Errores (ADR-001)
- Errores de negocio como excepción de dominio con `codigo` (o resultado tipado), traducidos **solo** en el middleware a `ProblemDetails` con `codigo`, `detail`, `traceId` y extras (`intentosRestantes`, `minutosRestantes`, `disponibleHoy`).
- Estados: `400` formato, `401` sesión, `403` cuenta bloqueada, `404` no encontrado, `422` negocio, `423` bloqueo temporal en login, `500` interno, `503` empresa no disponible.

### Asincronía e integración simulada (ADR-006)
- `async` de punta a punta salvo en la sección crítica; propagar `CancellationToken`.
- Polly v8 (`Polly.Core`): retry externo + timeout interno solo alrededor de `ConsultarDeudasAsync`; valores desde `Servicios:*`.

## Estilo

- `net10.0` (ADR-009) con el SDK fijado en `global.json`, `Nullable` habilitado y `TreatWarningsAsErrors` en todos los proyectos; solución `BilleRef.slnx`.
- *File-scoped namespaces*, un tipo por archivo, `dotnet format` sin cambios antes de cada commit.
- Registro de dependencias agrupado por capa en métodos de extensión (`AddDominio()`, `AddInfraestructura()`).

## Checklist de revisión

Recorrerlo completo antes de dar por terminada una tarea o de pedir una revisión (`billeref-revision`). Cada punto incumplido es un hallazgo; entre paréntesis, la regla que lo respalda.

### Montos
- [ ] Todo monto, saldo, límite y comisión es `decimal`; no aparece `double`, `float` ni `Math.Round` sobre dinero (ADR-005).
- [ ] Las entradas se parsean con `CultureInfo.InvariantCulture` y se **rechazan** con más de 2 decimales (`MONTO_DECIMALES`); nada se redondea (R-07.4).
- [ ] Orden de validación del monto: formato → > 0 → decimales → límite por transferencia (SPEC-HU-07, SPEC-HU-08).
- [ ] Los DTO exponen los montos como `string` con 2 decimales (`"185.40"`) y con signo en movimientos (`"-150.50"`).
- [ ] Límites y comisión salen de constantes (`LimitePorTransferencia`, `LimiteDiario`, `ComisionPago`); comparaciones inclusivas (`<=`) según S-04.
- [ ] El acumulado diario suma solo transferencias **enviadas y exitosas** del día calendario de Bolivia `[inicio, fin)` (R-08.4, R-08.5).
- [ ] El monto de un pago se toma de `IDeudaRepository`; el cuerpo no lo define (R-13.2).
- [ ] Total del pago y saldo resultante los calcula el backend y se devuelven en la respuesta.

### Logs sin datos sensibles
- [ ] Ningún log contiene el PIN, el `pinHash`, el JWT, la clave JWT ni las cabeceras `Authorization`, `X-Renewed-Token` o `Idempotency-Key` (ADR-007).
- [ ] Ningún log contiene saldos (antes o después de una operación).
- [ ] Celulares, nombres y códigos de cliente solo pasan por `Mascaras.Celular`, `Mascaras.Nombre` y `Mascaras.CodigoCliente`.
- [ ] Se usan plantillas estructuradas (`"Transferencia {Numero} de {Origen}"`), nunca interpolación de objetos completos (`{@Usuario}`, `{request}`) que puedan arrastrar datos sensibles.
- [ ] Celular, código de cliente y PIN viajan solo en cuerpos `POST`, nunca en rutas ni *query strings* (ADR-001).
- [ ] No se usa `UseHttpLogging` y `Microsoft.AspNetCore` está en `Warning`.
- [ ] La excepción no controlada devuelve `ERROR_INTERNO` con `traceId`, sin traza ni mensaje interno.
- [ ] Las pruebas API del cambio verifican los logs capturados (NF-01).

### Transacciones (operaciones de dinero)
- [ ] La operación pasa por el **pipeline común** (T-17), sin una copia propia del flujo (README de SPEC, orden de 10 pasos).
- [ ] La verificación del PIN ocurre **fuera** del lock y usa el contador compartido (R-02.5).
- [ ] Dentro del `SemaphoreSlim(1,1)`, en este orden: idempotencia → reglas de negocio → aplicar → guardar clave.
- [ ] Toda regla que depende del estado (saldo, límite diario, destinatario activo, deuda pendiente y más antigua) se evalúa **dentro** del lock.
- [ ] En el paso de aplicación no hay `await`, E/S ni llamadas al gateway; ante una excepción se restauran los valores previos y no se guarda la operación ni la clave (R-09.4, R-13.6).
- [ ] La transferencia guarda `saldoResultanteOrigen` y `saldoResultanteDestino` (R-09.7).
- [ ] Idempotencia: huella SHA-256 **sin PIN**, solo los éxitos guardan clave, repetición → `200` con el cuerpo original y `Idempotent-Replayed: true`, vigencia 24 h (SPEC-HU-10, SPEC-HU-14).
- [ ] El número de operación solo se asigna a operaciones exitosas (R-09.5).
- [ ] Hay prueba concurrente de 20 repeticiones si el cambio afecta saldos o deudas.

### Mensajes de error según la SPEC
- [ ] Cada error usa un código de `CodigosError` que existe en el catálogo de `02-historias/README.md`; no hay códigos nuevos sin agregarlos antes al catálogo y a la SPEC.
- [ ] El `detail` es **textualmente** el mensaje del catálogo, incluidos los valores variables con formato boliviano ("Disponible hoy: Bs 1.000,00", "Intenta nuevamente en 3 minutos.", "1 minuto" en singular).
- [ ] El código HTTP coincide con la tabla de errores de la SPEC (`400` formato, `401` sesión, `403`, `404`, `422` negocio, `423` bloqueo en login, `500`, `503`).
- [ ] Los extras del `ProblemDetails` están donde la SPEC los pide: `intentosRestantes`, `minutosRestantes`, `disponibleHoy`.
- [ ] El orden de evaluación produce el error que la SPEC indica cuando fallan varias reglas (p. ej. límite diario antes que saldo, SPEC-HU-09).
- [ ] Las respuestas no revelan existencia: celular inexistente = PIN incorrecto; comprobante ajeno o inexistente = `404 OPERACION_NO_ENCONTRADA`.
- [ ] Ningún literal de error en controladores ni servicios: todo sale del catálogo centralizado.

### General
- [ ] Cada regla nueva tiene su prueba `TC_HH_NN_…` (skill `billeref-testing`).
- [ ] Ruta, método y nombres de campos idénticos a la SPEC.
- [ ] Sin `DateTime.Now` / `UtcNow`; reloj por `TimeProvider`.
- [ ] `dotnet build` sin advertencias, `dotnet format` sin cambios y `dotnet test` en verde.
