# ADR-001 · Stack y arquitectura: Angular (web móvil/PWA) + .NET 8 Web API

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-002, ADR-003, ADR-008

## Contexto

La especificación deja el stack libre pero exige justificarlo (§5). Recomienda una interfaz web móvil (SPA o PWA) para poder probarla de punta a punta con el MCP de Playwright. El alcance es acotado: acceso, inicio, transferencias, pago de servicios e historial, con integraciones simuladas y base de datos opcional.

## Decisión

- **Frontend:** SPA en **Angular** (versión estable vigente) con TypeScript, diseño *mobile-first* y configurada como **PWA** (`@angular/pwa`) para instalarla en el celular. Se prueba en navegador con viewport móvil.
- **Backend:** **ASP.NET Core Web API sobre .NET 8** (C#), API REST con JSON.
- **Arquitectura del backend** en capas dentro de una solución:
  - `BilleRef.Api` — controladores, middleware (autenticación, manejo de errores, logs), DTOs.
  - `BilleRef.Domain` — entidades (`Usuario`, `Operacion`, `Deuda`) y reglas de negocio (límites, validaciones de monto, glosa, enmascaramiento).
  - `BilleRef.Infrastructure` — repositorios en memoria, carga de la semilla JSON, *gateway* simulado de empresas de servicios.
  - Las dependencias externas (repositorios, reloj, empresas de servicios) se acceden por interfaces para poder sustituirlas en pruebas.
- **Contrato API (resumen):**
  - `POST /api/auth/login`, `POST /api/auth/logout`
  - `GET /api/inicio`
  - `GET /api/usuarios/{celular}/destinatario` (nombre enmascarado)
  - `POST /api/transferencias`
  - `GET /api/servicios`, `GET /api/servicios/{empresaId}/deudas?codigoCliente=`
  - `POST /api/pagos`
  - `GET /api/historial?tipo=&desde=&hasta=`, `GET /api/operaciones/{numero}/comprobante`
- Toda regla de negocio se valida en el **backend**; el frontend repite las validaciones de formato solo para mejorar la experiencia.

## Alternativas consideradas

- **React + Vite / Node + Express (TypeScript):** un solo lenguaje y arranque rápido; descartada por preferencia del equipo hacia un stack más cercano al entorno corporativo bancario.
- **Next.js full-stack:** menos piezas, pero mezcla frontend y reglas de negocio en el mismo proyecto.
- **App nativa (Flutter / Kotlin):** obligaría a justificar otra estrategia de E2E distinta a Playwright.

## Consecuencias

- **Positivas:** tipado fuerte en ambos extremos; `decimal` nativo en C# para dinero (ADR-005); separación clara de reglas en `Domain`, fácil de probar con xUnit; la web móvil se prueba directamente con Playwright MCP.
- **Negativas:** dos lenguajes (TypeScript y C#) y dos procesos que levantar (`ng serve` y `dotnet run`); hay que configurar CORS o un *proxy* de Angular en desarrollo.
- **Riesgo:** **.NET 8 termina su soporte (LTS) en noviembre de 2026.** Para un trabajo académico es aceptable; si el proyecto continúa, migrar a **.NET 10 (LTS)**, lo que no debería requerir cambios relevantes en este alcance.
