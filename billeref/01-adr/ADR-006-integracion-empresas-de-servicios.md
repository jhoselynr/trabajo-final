# ADR-006 · Integración simulada con empresas de servicios: timeout y reintento

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-002, ADR-004, ADR-005

## Contexto

§5 exige simular las empresas de servicios y las notificaciones. §3.4 indica que el sistema consulta las deudas pendientes de un código de cliente y que se paga una deuda por su monto total, siempre la más antigua primero. §7 pregunta qué pasa si la consulta de deudas falla o tarda.

## Decisión

### Simulación
- Interfaz `IEmpresaServiciosGateway` con un único método `ConsultarDeudasAsync(empresaId, codigoCliente, CancellationToken)`. Representa la llamada externa a la empresa y es **lo único** que puede tardar o fallar.
- Implementación `EmpresaServiciosMock`, que obtiene las deudas de `IDeudaRepository` (ADR-002; no guarda una copia propia) y simula la latencia de una empresa real. Debe respetar el `CancellationToken` (la demora se implementa con `Task.Delay(..., token)`).
- El estado de la deuda (pendiente o pagada) se cambia **solo** en `IDeudaRepository`, dentro de la sección crítica del pago (ver "Pago" más abajo). No existe un método "registrar pago" en el gateway.
- **Comportamiento configurable** del mock, por empresa: `NORMAL` (por defecto), `LENTO` (demora mayor al timeout) o `FALLA` (lanza una excepción). Se cambia con `POST /api/test/empresas/comportamiento` `{empresaId, modo}`, **solo en `Development`**, y vuelve a `NORMAL` con `POST /api/test/reset`. No se agregan códigos de cliente especiales a la semilla.

### Consulta de deudas: timeout y reintento
- **Timeout de 10 segundos por intento** y **1 reintento automático** en el backend, con un `ResiliencePipeline` de **Polly v8** (`Polly.Core`: estrategia de *timeout* + *retry*) alrededor de `ConsultarDeudasAsync`. No se usa `Microsoft.Extensions.Http.Resilience` porque el mock no usa `HttpClient`. El peor caso es de unos 20 segundos.
- Los valores son configurables (`Servicios:TimeoutSegundos = 10`, `Servicios:Reintentos = 1` en `appsettings.json`), para que las pruebas de integración y E2E puedan usar un timeout más corto.
- Durante la espera, el frontend muestra un indicador de carga ("Consultando deudas…").
- Si ambos intentos fallan o vencen: el backend responde `503` y el usuario ve **"El servicio de {empresa} no está disponible. Intenta más tarde."** con un botón **Reintentar**.
- La consulta es de solo lectura: un fallo **nunca** genera débito.

### Resultados de la consulta
- **Código inexistente en la empresa:** "El código de cliente no existe en {empresa}".
- **Código sin deudas** (p. ej. NA-3004): "No tienes deudas pendientes con {empresa}".
- **Con deudas:** se listan ordenadas por vencimiento; solo la **más antigua** se puede seleccionar, las demás se muestran deshabilitadas con el texto "Paga primero el periodo {periodo}".

### Pago
- Antes de confirmar se muestra: empresa, código, periodo, monto, **comisión Bs 1,00** y **total**.
- `POST /api/pagos` recibe `{empresaId, codigoCliente, periodo}`; **el monto no lo envía el cliente**, se toma de la deuda en `IDeudaRepository`.
- Al confirmar, el backend sigue el orden de ADR-002: verifica el PIN fuera del lock y, dentro de la sección crítica, valida **leyendo `IDeudaRepository` directamente** (sin pasar por el gateway, sin demora ni timeout) que la deuda exista, siga pendiente, sea la más antigua y que el saldo cubra monto + comisión. Luego debita, marca la deuda como pagada y registra la operación, todo junto.
- Así ninguna operación de pago puede quedar a medias por una falla del mock. Si en el futuro la empresa fuera un servicio remoto, se necesitaría un ADR nuevo (reversión o patrón de compensación).
- Una deuda ya pagada responde "Esta deuda ya fue pagada" (`422`, código `DEUDA_YA_PAGADA`); una deuda que no es la más antigua, "Paga primero el periodo {periodo}" (`422`, código `DEUDA_NO_ES_LA_MAS_ANTIGUA`).

### Notificaciones
- Se simulan con `INotificador` → `NotificadorLog`, que solo escribe una entrada en el log (con datos enmascarados según ADR-007).

## Alternativas consideradas

- **Timeout de 5 s sin reintento automático:** respuesta más rápida al usuario, pero más sensible a demoras puntuales.
- **API falsa en un proceso aparte (json-server / WireMock):** más realista, pero agrega otro proceso que levantar.

## Consecuencias

- **Positivas:** tolerancia a fallas pasajeras sin intervención del usuario; comportamiento de error reproducible en pruebas.
- **Negativas:** en el peor caso el usuario espera ~20 s antes de ver el error.
- La política de timeout se aplica solo a `POST /api/servicios/deudas`, nunca a `POST /api/pagos`.
