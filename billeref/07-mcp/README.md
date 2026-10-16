# MCP de Playwright · BilleRef

Servidor MCP que permite a Claude Code conducir un navegador para ejecutar los casos E2E del [plan de pruebas](../04-plan-de-pruebas/plan-pruebas.md) (tarea T-26). Cómo usarlo caso por caso: skill `billeref-testing`, [`referencias/playwright-mcp.md`](../06-skills/billeref-testing/referencias/playwright-mcp.md).

## Versión y configuración

| Elemento | Valor | Por qué |
|---|---|---|
| Paquete | `@playwright/mcp@0.0.83` (fijado) | Con `@latest` las herramientas pueden cambiar entre sesiones y las pruebas dejarían de ser repetibles |
| Configuración | [`playwright-mcp.config.json`](playwright-mcp.config.json) | Ver tabla siguiente |
| Alcance | Local (en `~/.claude.json`, solo para este usuario y este proyecto) | No guarda secretos, pero el registro depende de rutas de esta máquina |

| Opción | Valor | Requisito que cubre |
|---|---|---|
| `browser.launchOptions.channel` | `chrome` | Usa Google Chrome instalado (basado en Chromium); no requiere descargar navegadores de Playwright |
| `browser.launchOptions.headless` | `false` | El navegador se ve mientras se prueba; cambiar a `true` para ejecutar sin ventana |
| `browser.isolated` | `true` | Perfil en memoria: ninguna sesión, almacenamiento ni caché sobrevive entre sesiones del MCP (complementa el reset de datos de cada caso) |
| `contextOptions.viewport` | 390×844 | Interfaz móvil del plan de pruebas (CT-06, NF-05) |
| `contextOptions.isMobile`, `hasTouch` | `true` | Emula un teléfono (eventos táctiles, *meta viewport*) |
| `contextOptions.timezoneId` | `America/La_Paz` | Fechas mostradas en hora de Bolivia (CT-02) |
| `contextOptions.locale` | `es-BO` | Formato regional boliviano |
| `outputDir` | `.playwright-mcp` | Solo archivos sin nombre explícito; está en `.gitignore`. Las evidencias se guardan **con nombre explícito** en `08-evidencias/` |

## Registro en Claude Code

Desde `billeref/` (PowerShell). En Windows nativo, los servidores lanzados con `npx` necesitan `cmd /c`:

```powershell
claude mcp remove playwright -s local   # solo si ya estaba registrado
claude mcp add playwright -- cmd /c npx -y @playwright/mcp@0.0.83 --config "<ruta absoluta>\billeref\07-mcp\playwright-mcp.config.json"
claude mcp get playwright               # debe mostrar "✔ Connected"
```

Las herramientas del servidor aparecen en las sesiones de Claude Code que se abran **después** del registro.

## Requisitos

- Node.js con `npx` (probado con Node 24).
- Google Chrome instalado en la ruta estándar. Sin Chrome: cambiar `channel` a `msedge`, o quitar `channel` y ejecutar `npx playwright install chromium`.
- Para los casos E2E, backend y frontend levantados como indica el plan de pruebas §5.

## Herramientas que usa BilleRef

Verificadas en la documentación de la versión fijada:

| Herramienta | Uso |
|---|---|
| `browser_navigate` | Abrir la app o una ruta |
| `browser_snapshot` | Leer la página y obtener las referencias de los elementos |
| `browser_type`, `browser_fill_form`, `browser_click`, `browser_select_option`, `browser_press_key` | Interactuar con formularios y botones |
| `browser_wait_for` | Esperar un texto |
| `browser_evaluate` | `fetch` a los endpoints de prueba; medir el desplazamiento horizontal |
| `browser_run_code_unsafe` | Código de Playwright sobre la página; se usa **solo** para `page.clock` en los casos de inactividad |
| `browser_network_requests` | Contar o descartar solicitudes |
| `browser_take_screenshot` | Evidencias; `filename` relativo a la raíz del proyecto (`08-evidencias/TC-…/…png`) |
| `browser_resize` | Volver a 390×844 si se cambió |

## Actualizar la versión

1. `npm view @playwright/mcp version` para ver la última.
2. Revisar los cambios de herramientas en la documentación del paquete.
3. Volver a registrar con la versión nueva y ejecutar la suite de humo.
4. Actualizar esta página, la referencia de la skill y la bitácora.
