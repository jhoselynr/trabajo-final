---
name: billeref-testing
description: Escribir, ejecutar o corregir pruebas de BilleRef (xUnit, Jest o E2E con Playwright MCP) a partir de los casos TC-HH-NN de la matriz de trazabilidad, y registrar su evidencia en el reporte de ejecución. Usar al implementar una tarea de 05-desarrollo/tareas.md, al agregar pruebas para un criterio CA-HH.N, al ejecutar una suite o un caso, al probar en el navegador con los datos semilla, o al guardar evidencias en 08-evidencias/.
---

# Pruebas de BilleRef

Las pruebas de BilleRef no se inventan: cada una implementa un caso `TC-HH-NN` de `04-plan-de-pruebas/matriz-trazabilidad.md`, que verifica el criterio `CA-HH.N` de `02-historias/HU-HH-*.md` y las reglas `R-HH.N` de `03-especificaciones/SPEC-HU-HH-*.md`. Todo caso ejecutado termina con su evidencia registrada en `08-evidencias/reporte-ejecucion.md`.

Referencias de esta skill (leerlas cuando se necesiten):
- [`referencias/playwright-mcp.md`](referencias/playwright-mcp.md) — E2E con Playwright MCP y los datos semilla, paso a paso.
- [`referencias/reporte-evidencias.md`](referencias/reporte-evidencias.md) — cómo guardar evidencias y registrarlas en el reporte.
- [`plantillas/reporte-ejecucion.md`](plantillas/reporte-ejecucion.md) — plantilla del reporte.

## 1. Flujo de un caso

1. **Ubicar el caso.** La tarea de `05-desarrollo/tareas.md` lista sus TC. Para cada uno leer en la matriz el **Tipo** y la **Evidencia esperada**, el escenario Gherkin del CA en la historia y las reglas que lo citan en la SPEC (con sus casos borde).
2. **Escribir la prueba en rojo** con los datos exactos del escenario (celulares, montos, mensajes). Códigos y mensajes de error se copian del catálogo de `02-historias/README.md`, nunca se parafrasean.
3. **Ejecutarla y verla fallar** por la razón correcta (no por un error de compilación o de datos).
4. **Implementar hasta verde** y ejecutar la suite completa del nivel para no romper nada.
5. **Registrar la evidencia** en `08-evidencias/<TC-ID>/` y la fila del caso en el reporte (sección 6).

## 2. Elegir el nivel

| Si el criterio… | Nivel |
|---|---|
| Es una tabla de valores (montos, glosas, formatos, máscaras, fechas) | Unitaria (back y/o front) |
| Describe comportamiento interno del frontend (temporizador, *interceptor*, botón deshabilitado) | Unitaria (front) |
| Necesita estado preparado (acumulado diario, saldo exacto), reloj controlado, fallas inyectadas o concurrencia | API |
| Describe lo que el usuario ve y se reproduce con la semilla | E2E |

Si la matriz indica dos tipos (`E2E · API`), se escriben y ejecutan ambos.

## 3. Cómo escribir las pruebas

### Nombres
- xUnit: método `TC_07_02_MontosInvalidos`; un `[Theory]` por caso con tablas.
- Jest: `describe('TC-07-02 Montos inválidos', …)`.
- E2E: el ID del caso encabeza los pasos y nombra la carpeta de evidencias.

Con esta convención, un filtro por `TC_07_02` (xUnit) o `TC-07-02` (Jest) ejecuta exactamente ese caso.

### Unitarias del backend (`tests/BilleRef.Domain.Tests`)

```csharp
[Theory]
[InlineData("0", CodigosError.MontoNoPositivo)]
[InlineData("10,001", CodigosError.MontoDecimales)]
[InlineData("1.500", CodigosError.MontoDecimales)]
[InlineData("1.000,50", CodigosError.MontoInvalido)]
public void TC_07_02_MontosInvalidos(string entrada, string codigoEsperado)
{
    var resultado = ValidadorMonto.Validar(entrada);
    Assert.False(resultado.EsValido);
    Assert.Equal(codigoEsperado, resultado.Codigo);
}
```

- Solo `Assert` de xUnit (FluentAssertions descartado por licencia, ADR-008).
- Fechas y horas con `FakeTimeProvider`, nunca `DateTime.Now`.

### API (`tests/BilleRef.Api.Tests`)

```csharp
[Fact]
public async Task TC_10_02_ReintentoTrasPerderLaRespuesta()
{
    await using var app = new BilleRefFactory();               // estado limpio
    var cliente = await app.ClienteAutenticado("70000001", "1111");
    var clave = Guid.NewGuid();
    var cuerpo = new { celularDestino = "70000002", monto = "100.00", glosa = (string?)null, pin = "1111" };

    var primera = await cliente.PostTransferencia(cuerpo, clave);
    var repetida = await cliente.PostTransferencia(cuerpo, clave);

    Assert.Equal(HttpStatusCode.Created, primera.StatusCode);
    Assert.Equal(HttpStatusCode.OK, repetida.StatusCode);
    Assert.Equal("true", repetida.Headers.GetValues("Idempotent-Replayed").Single());
    Assert.Equal(await primera.NumeroOperacion(), await repetida.NumeroOperacion());
    Assert.Equal("4900.00", await cliente.Saldo());            // un solo débito
    app.Logs.AssertSinDatosSensibles();                        // NF-01
}
```

- Una `WebApplicationFactory` **nueva por prueba**, con `FakeTimeProvider`, proveedor de logs en memoria y, si hace falta, el *builder* de escenarios (datos preparados de la §4 del plan de pruebas).
- Login real con `POST /api/auth/login`; solo se fabrican JWT para probar tokens inválidos o vencidos.
- En cada prueba de dinero se verifican **tres cosas**: código HTTP, `codigo` del `ProblemDetails` (o el comprobante) y el **saldo** consultado por API.
- **Tiempo:** `fakeTime.Advance(TimeSpan.FromMinutes(5))` para bloqueos; `fakeTime.SetUtcNow(...)` para la medianoche de Bolivia (00:00 −04:00 = 04:00 UTC) y para el vencimiento de claves (24 h).
- **Concurrencia** (TC-08-07, TC-10-01, TC-14-05): `Task.WhenAll` con las solicitudes simultáneas, dentro de un bucle de **20 repeticiones** con una factory nueva en cada vuelta. Un solo fallo es un defecto Crítico.
- **Fallas inyectadas** (TC-09-06, TC-13-08): reemplazar el repositorio de operaciones por un doble que lance una excepción; verificar `500 ERROR_INTERNO` y saldos, deuda e historial intactos.
- **Empresas** (HU-12): `POST /api/test/empresas/comportamiento` o un doble de `IEmpresaServiciosGateway`, con `Servicios:TimeoutSegundos` bajo en la configuración de la prueba.
- **Logs (NF-01):** al final de cada prueba API, los logs capturados no contienen PIN de la semilla, celulares completos (`70000001`…`70000004`) ni saldos.

### Unitarias del frontend (Jest)

- Servicios HTTP con `HttpTestingController`; verificar URL, método, cuerpo y cabeceras (`Authorization`, `Idempotency-Key`).
- Temporizadores con `jest.useFakeTimers()` y `jest.advanceTimersByTime(...)` (inactividad de 5 min, renovación con menos de 60 s).
- Los montos se comparan como cadena (`'150.50'`), nunca como número.
- Formularios: probar el validador y el estado del botón, no detalles del DOM que el criterio no menciona.

## 4. Cómo ejecutar las pruebas

Desde la raíz de `billeref/` (PowerShell). Los reportes van a `08-evidencias/reportes/`.

### Backend

| Para… | Comando |
|---|---|
| Todo el backend | `dotnet test 05-desarrollo/backend/BilleRef.slnx` |
| Un caso | `dotnet test 05-desarrollo/backend/BilleRef.slnx --filter "FullyQualifiedName~TC_10_02"` |
| Todos los casos de una historia | `dotnet test 05-desarrollo/backend/BilleRef.slnx --filter "FullyQualifiedName~TC_10_"` |
| Solo unitarias o solo API | `dotnet test 05-desarrollo/backend/tests/BilleRef.Domain.Tests` · `dotnet test 05-desarrollo/backend/tests/BilleRef.Api.Tests` |
| Con reporte y cobertura (cierre) | `dotnet test 05-desarrollo/backend/BilleRef.slnx --logger "trx;LogFileName=backend.trx" --results-directory 08-evidencias/reportes --collect:"XPlat Code Coverage"` |

### Frontend

| Para… | Comando (en `05-desarrollo/frontend`) |
|---|---|
| Todo el frontend | `npx jest` |
| Un caso | `npx jest -t "TC-07-02"` |
| Mientras se desarrolla | `npx jest --watch` |
| Con reporte y cobertura (cierre) | `$env:JEST_JUNIT_OUTPUT_DIR = "../../08-evidencias/reportes"; npx jest --coverage --reporters=default --reporters=jest-junit` |

### E2E

Requiere backend y frontend levantados como indica el plan de pruebas §5 (backend con `Servicios__TimeoutSegundos=2`). Se ejecuta con el MCP de Playwright siguiendo [`referencias/playwright-mcp.md`](referencias/playwright-mcp.md).

### Orden recomendado
1. Unitarias (back y front) en cada cambio.
2. API en cada cambio.
3. Suite de humo E2E (plan de pruebas §3) y luego los E2E de la fase.
4. Al cierre de una fase: todo con reportes y cobertura.

Una prueba que falla no se "arregla" cambiando lo esperado para que coincida con el código: primero se confirma qué dice la SPEC.

## 5. E2E con Playwright MCP y los datos semilla (resumen)

- **Antes de cada caso:** `POST /api/test/reset` desde el navegador (con `fetch`) para volver a la semilla, y modo `NORMAL` en las empresas.
- **Datos:** usar los usuarios, PIN, códigos de cliente y montos de la semilla exactamente como en el escenario (tabla en la referencia).
- **Navegador:** 390×844, zona horaria `America/La_Paz`.
- **Pasos:** los del Gherkin, en orden, con los textos exactos; entre pasos, `browser_snapshot` para ubicar elementos.
- **Verificar** el texto esperado en la página, la ausencia de desplazamiento horizontal (NF-05) y, si el criterio habla de saldos, el saldo por API.
- **Capturar** la evidencia que pide la matriz.

Detalle completo, herramientas y un ejemplo de punta a punta: [`referencias/playwright-mcp.md`](referencias/playwright-mcp.md).

## 6. Registrar la evidencia en el reporte (resumen)

1. Guardar los archivos en `08-evidencias/<TC-ID>/` con el nombre `<TC-ID>_<descripcion>.<ext>`: capturas `.png` para E2E; extracto del resultado (`.txt`) y respuestas (`.json`) para API y unitarias.
2. En `08-evidencias/reporte-ejecucion.md` (crearlo desde la plantilla si no existe) actualizar la fila del caso: fecha, resultado (Aprobado / Fallido / Bloqueado), enlaces a la evidencia y defecto si lo hay.
3. Si falla: registrar el defecto `D-NN` con severidad del plan de pruebas (§8), pasos y resultado esperado vs. obtenido.
4. Actualizar el resumen del reporte (totales y criterios de salida).

Detalle y formato: [`referencias/reporte-evidencias.md`](referencias/reporte-evidencias.md).

## 7. Errores frecuentes a evitar

- Afirmar "Vencida" sobre la deuda 2026-09 de LV-1001 en E2E: depende de la fecha real.
- Compartir estado entre pruebas API (factory compartida) o entre casos E2E (sin reset).
- Esperar tiempo real (`Task.Delay`, esperas largas en el navegador) en lugar de relojes falsos.
- Probar solo el código HTTP en operaciones de dinero sin verificar el saldo.
- Escribir mensajes de error "parecidos" a los del catálogo.
- Marcar un caso como Aprobado sin su evidencia guardada y enlazada en el reporte.
