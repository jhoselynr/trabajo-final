# ADR-001 · Stack y arquitectura: Angular (web móvil/PWA) + .NET 8 Web API

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-002 a ADR-008

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
  - `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/renovar` (ADR-003)
  - `GET /api/inicio`
  - `POST /api/transferencias/destinatario` — cuerpo `{celular}`; devuelve el nombre enmascarado
  - `POST /api/transferencias` — requiere `Idempotency-Key` (ADR-004)
  - `GET /api/servicios` — tipos de servicio y empresas
  - `POST /api/servicios/deudas` — cuerpo `{empresaId, codigoCliente}`
  - `POST /api/pagos` — requiere `Idempotency-Key` (ADR-004)
  - `GET /api/historial?tipo=&desde=&hasta=` — `tipo` ∈ `TRANSFERENCIA_ENVIADA`, `TRANSFERENCIA_RECIBIDA`, `PAGO_SERVICIO` (vacío = todos); fechas `AAAA-MM-DD` (ADR-005)
  - `GET /api/operaciones/{numero}/comprobante` — solo si el usuario es el origen o el destino de la operación; si no, `404`
  - Solo en `Development`: `POST /api/test/reset` (ADR-002) y `POST /api/test/empresas/comportamiento` (ADR-006)
- **Datos sensibles nunca en la URL:** el celular, el código de cliente y el PIN viajan solo en el cuerpo de solicitudes `POST`, porque las rutas y *query strings* pueden quedar en logs (ADR-007).
- **Formato de error único:** `ProblemDetails` (RFC 9457) con un campo adicional `codigo` (p. ej. `SALDO_INSUFICIENTE`, `LIMITE_DIARIO`, `PIN_INCORRECTO`, `SERVICIO_NO_DISPONIBLE`) y `detail` con el mensaje para el usuario. Errores de negocio → `422`; sin sesión o sesión vencida → `401`; validación de formato → `400`; servicio de empresa no disponible → `503` (ADR-006). Los códigos propios del login (`401`, `403`, `423`) se definen en ADR-003.
- **CORS en desarrollo:** se usa el *proxy* de Angular (`proxy.conf.json`) hacia la API, así no se necesita CORS. Si se habilitara CORS, debe exponer la cabecera `X-Renewed-Token` (`Access-Control-Expose-Headers`).
- Toda regla de negocio se valida en el **backend**; el frontend repite las validaciones de formato solo para mejorar la experiencia.

## Alternativas consideradas

- **React + Vite / Node + Express (TypeScript):** un solo lenguaje y arranque rápido; descartada por preferencia del equipo hacia un stack más cercano al entorno corporativo bancario.
- **Next.js full-stack:** menos piezas, pero mezcla frontend y reglas de negocio en el mismo proyecto.
- **App nativa (Flutter / Kotlin):** obligaría a justificar otra estrategia de E2E distinta a Playwright.

## Consecuencias

- **Positivas:** tipado fuerte en ambos extremos; `decimal` nativo en C# para dinero (ADR-005); separación clara de reglas en `Domain`, fácil de probar con xUnit; la web móvil se prueba directamente con Playwright MCP.
- **Negativas:** dos lenguajes (TypeScript y C#) y dos procesos que levantar (`ng serve` y `dotnet run`).
- **Riesgo:** **.NET 8 termina su soporte (LTS) en noviembre de 2026.** Para un trabajo académico es aceptable; si el proyecto continúa, migrar a **.NET 10 (LTS)**, lo que no debería requerir cambios relevantes en este alcance.
