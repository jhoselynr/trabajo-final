# ADR-006 · Integración simulada con empresas de servicios: timeout y reintento

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-002, ADR-004, ADR-005

## Contexto

§5 exige simular las empresas de servicios y las notificaciones. §3.4 indica que el sistema consulta las deudas pendientes de un código de cliente y que se paga una deuda por su monto total, siempre la más antigua primero. §7 pregunta qué pasa si la consulta de deudas falla o tarda.

## Decisión

### Simulación
- Interfaz `IEmpresaServiciosGateway` con `ConsultarDeudasAsync(empresaId, codigoCliente)` y `RegistrarPago(empresaId, codigoCliente, periodo)`.
- Implementación `EmpresaServiciosMock` que lee `empresas.json` (ADR-002) y mantiene en memoria el estado pagado/pendiente de cada deuda.
- El mock admite **comportamientos configurables** para pruebas (en `appsettings.Development.json` o por código de cliente especial):
  - demora artificial (para probar el timeout),
  - fallo (para probar el error),
  - respuesta normal.

### Consulta de deudas: timeout y reintento
- **Timeout de 10 segundos por intento** y **1 reintento automático** en el backend (con Polly / `Microsoft.Extensions.Http.Resilience`, o una política equivalente alrededor del gateway). El peor caso es de unos 20 segundos.
- Durante la espera, el frontend muestra un indicador de carga ("Consultando deudas…").
- Si ambos intentos fallan o vencen: el backend responde `503` y el usuario ve **"El servicio de {empresa} no está disponible. Intenta más tarde."** con un botón **Reintentar**.
- La consulta es de solo lectura: un fallo **nunca** genera débito.

### Resultados de la consulta
- **Código inexistente en la empresa:** "El código de cliente no existe en {empresa}".
- **Código sin deudas** (p. ej. NA-3004): "No tienes deudas pendientes con {empresa}".
- **Con deudas:** se listan ordenadas por vencimiento; solo la **más antigua** se puede seleccionar, las demás se muestran deshabilitadas con el texto "Paga primero el periodo {periodo}".

### Pago
- Antes de confirmar se muestra: empresa, código, periodo, monto, **comisión Bs 1,00** y **total**.
- Al confirmar, el backend vuelve a validar dentro de la sección crítica (ADR-002) que la deuda siga pendiente, que sea la más antigua y que el saldo cubra monto + comisión; luego debita, marca la deuda como pagada y registra la operación, todo junto.
- Como el mock es local y no hace E/S, el registro del pago en la empresa no puede fallar a mitad de la operación. Si en el futuro la empresa fuera un servicio remoto, se necesitaría un ADR nuevo (reversión o patrón de compensación).
- Una deuda ya pagada responde "Esta deuda ya fue pagada".

### Notificaciones
- Se simulan con `INotificador` → `NotificadorLog`, que solo escribe una entrada en el log (con datos enmascarados según ADR-007).

## Alternativas consideradas

- **Timeout de 5 s sin reintento automático:** respuesta más rápida al usuario, pero más sensible a demoras puntuales.
- **API falsa en un proceso aparte (json-server / WireMock):** más realista, pero agrega otro proceso que levantar.

## Consecuencias

- **Positivas:** tolerancia a fallas pasajeras sin intervención del usuario; comportamiento de error reproducible en pruebas.
- **Negativas:** en el peor caso el usuario espera ~20 s antes de ver el error.
- La política de timeout se aplica también a la consulta previa al pago, nunca al débito.
