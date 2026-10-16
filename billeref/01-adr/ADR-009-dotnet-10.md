# ADR-009 · Backend en .NET 10 LTS con solución `.slnx`

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Reemplaza:** la versión de .NET de ADR-001 (el resto de ADR-001 sigue vigente)
- **Relacionados:** ADR-001, ADR-008

## Contexto

ADR-001 eligió .NET 8 y dejó como riesgo que su soporte LTS termina en noviembre de 2026, es decir, antes o durante el desarrollo de BilleRef. Al configurar los hooks del proyecto se comprobó además que:

- La máquina de desarrollo solo tiene el **SDK 10.0.300**; .NET 8 está disponible únicamente como *runtime*.
- El SDK de .NET 10 crea las soluciones en formato **`.slnx`** (XML) por defecto, mientras que los documentos decían `BilleRef.sln`.

Todavía no hay código, así que cambiar de versión no tiene costo de migración.

## Decisión

- **Plataforma:** todos los proyectos del backend apuntan a **`net10.0`** (.NET 10 LTS, soporte hasta noviembre de 2028).
- **SDK fijado** con `05-desarrollo/backend/global.json`:
  ```json
  { "sdk": { "version": "10.0.300", "rollForward": "latestFeature" } }
  ```
- **Solución:** `05-desarrollo/backend/BilleRef.slnx`, el formato por defecto del SDK 10.
- **Paquetes de Microsoft** (`Microsoft.AspNetCore.Authentication.JwtBearer`, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.Extensions.Identity.Core`, `Microsoft.Extensions.TimeProvider.Testing`) en la versión mayor **10.x**, alineada con el *runtime*.
- **Pruebas:** `dotnet test` en modo VSTest (el predeterminado), para que funcionen igual los filtros `--filter "FullyQualifiedName~TC_…"` y los reportes `.trx` de la skill `billeref-testing`.
- Todo lo demás de ADR-001 (Angular PWA, capas Api/Domain/Infrastructure, contrato de la API, formato de errores, *proxy* sin CORS) no cambia.

## Alternativas consideradas

- **Mantener .NET 8 con el SDK 10** (apuntar a `net8.0`): posible porque el *runtime* 8 está instalado, pero el proyecto nacería con una versión sin soporte a las pocas semanas.
- **Instalar el SDK 8:** agrega una instalación sin ningún beneficio sobre .NET 10.
- **Seguir con `.sln`** (`dotnet new sln --format sln`): compatible con herramientas antiguas, pero el SDK 10, Visual Studio actual y `dotnet` CLI ya manejan `.slnx`, que es más legible y genera menos conflictos.

## Consecuencias

- **Positivas:** soporte hasta 2028; un solo SDK en la máquina; los comandos de la documentación coinciden con lo que crea el SDK.
- **Negativas:** herramientas antiguas que solo entienden `.sln` no abren la solución (no se usan en el proyecto).
- **Cambios en otros documentos:** ADR-001 (anotado), `CLAUDE.md`, plan de pruebas §5 y riesgos, plan de desarrollo, tarea T-01, skills `billeref-testing` y `billeref-convenciones-backend`, plantilla del reporte y subagente `revisor-seguridad`. El hook `verificar-cambios.mjs` ya acepta `.slnx` y `.sln`.
