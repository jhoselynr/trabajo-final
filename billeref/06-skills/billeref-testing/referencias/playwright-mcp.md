# E2E con Playwright MCP y los datos semilla

Cómo ejecutar los casos E2E de la matriz conduciendo el navegador con el MCP de Playwright.

## 1. Preparación (una vez por sesión)

1. **Backend** con el timeout corto de empresas (plan de pruebas §5):
   ```powershell
   cd 05-desarrollo/backend
   $env:Servicios__TimeoutSegundos = "2"
   dotnet run --project src/BilleRef.Api
   ```
2. **Frontend:** `cd 05-desarrollo/frontend; ng serve` → `http://localhost:4200`. El *proxy* de Angular reenvía `/api` al backend, así que desde la página se puede llamar a la API con rutas relativas.
3. **MCP de Playwright** registrado según [`07-mcp/README.md`](../../../07-mcp/README.md): `@playwright/mcp@0.0.83` con Chrome, 390×844 táctil, `America/La_Paz` y `es-BO`, perfil aislado. Si `claude mcp get playwright` no muestra "✔ Connected", registrarlo antes de seguir.
4. **Herramientas.** Las de la tabla están verificadas para la versión fijada. Si se actualiza la versión, revisar la lista en `07-mcp/README.md`.

| Herramienta | Uso en BilleRef |
|---|---|
| `browser_navigate` | Abrir `http://localhost:4200` o una ruta (`/historial`) |
| `browser_resize` | Asegurar 390×844 si la configuración no lo fija |
| `browser_snapshot` | Leer la página (árbol de accesibilidad) y obtener las referencias de los elementos |
| `browser_type` / `browser_fill_form` | Escribir celular, PIN, monto, glosa, código de cliente |
| `browser_click` | Botones y opciones ("Ingresar", "Confirmar", "Luz"…) |
| `browser_wait_for` | Esperar un texto ("Consultando deudas…", el comprobante) |
| `browser_evaluate` | Llamar a la API de prueba con `fetch` y medir el desplazamiento horizontal |
| `browser_run_code_unsafe` | Ejecutar código de Playwright sobre la página; **solo** para `page.clock` (sección 6) |
| `browser_network_requests` | Comprobar que no se envió una solicitud (TC-01-04) o que hubo una sola (TC-10-01) |
| `browser_take_screenshot` | Guardar la evidencia con `filename` relativo a la raíz del proyecto: `08-evidencias/TC-HH-NN/TC-HH-NN_<descripcion>.png` |

## 2. Datos semilla para los escenarios

| Rol en el escenario | Celular | PIN | Saldo inicial | Para qué |
|---|---|---|---|---|
| Ana | 70000001 | 1111 | Bs 5.000,00 | Origen de transferencias y pagos; límites |
| Bruno | 70000002 | 2222 | Bs 800,00 | Destinatario; pago de NA-3003 |
| Carla | 70000003 | 3333 | Bs 0,00 | Saldo insuficiente; historial vacío |
| Diego (bloqueado) | 70000004 | 4444 | Bs 1.200,00 | Cuenta bloqueada; destino no disponible |
| Inexistente | 79999999 | cualquiera | — | Celular que no existe |

| Empresa en pantalla | Servicio | Código | Qué esperar |
|---|---|---|---|
| Luz del Valle S.A. | Luz | LV-1001 | 2026-08 Bs 185,40 seleccionable; 2026-09 Bs 172,10 deshabilitada |
| Aguas Claras | Agua | AC-2002 | 2026-09 Bs 64,00 |
| NetAndes | Internet | NA-3003 | 2026-10 Bs 249,00 |
| NetAndes | Internet | NA-3004 | "No tienes deudas pendientes con NetAndes" |
| Luz del Valle S.A. | Luz | LV-9999 | "El código de cliente no existe en Luz del Valle S.A." |

Valores derivados útiles para verificar: Ana tras transferir Bs 150,50 → Bs 4.849,50; Bruno tras recibirlos → Bs 950,50; Ana tras pagar LV-1001 2026-08 → Bs 4.813,60; Bruno tras pagar NA-3003 → Bs 550,00.

Los PIN de la semilla se escriben en el navegador pero **nunca** se copian en el reporte ni en notas de evidencia.

## 3. Reset y control de empresas desde el navegador

Antes de **cada** caso, con `browser_evaluate` sobre cualquier página de la app:

```js
async () => {
  const r = await fetch('/api/test/reset', { method: 'POST' });
  return r.status;            // esperado: 204 o 200
}
```

Para los casos de HU-12, cambiar el modo de una empresa (`NORMAL`, `LENTO`, `FALLA`):

```js
async () => {
  const r = await fetch('/api/test/empresas/comportamiento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empresaId: 'luz-del-valle', modo: 'LENTO' })
  });
  return r.status;            // esperado: 204
}
```

Luego recargar la app (`browser_navigate` a `/`), lo que además cierra cualquier sesión previa (el token vive en memoria).

## 4. Verificaciones comunes

- **Texto esperado:** con `browser_snapshot` o `browser_wait_for` sobre el texto exacto del criterio.
- **Sin desplazamiento horizontal (NF-05)**, en la pantalla final de cada caso:
  ```js
  () => document.documentElement.scrollWidth <= 390
  ```
- **Saldo** cuando el criterio dice "mi saldo sigue siendo…": navegar a la pantalla de inicio de la app y leer el saldo mostrado. No se puede consultar `/api/inicio` con `fetch` desde `browser_evaluate`, porque el token vive en la memoria del servicio Angular y no es accesible desde la página.

## 5. Ejemplo completo · TC-09-02 Transferencia exitosa

1. `browser_navigate` → `http://localhost:4200`.
2. `browser_evaluate` → reset (sección 3). `browser_navigate` → `/`.
3. `browser_snapshot`; `browser_type` celular `70000001`, PIN `1111`; `browser_click` "Ingresar".
4. `browser_wait_for` texto `Ana Ficticia Rojas`.
5. `browser_click` "Transferir"; `browser_type` celular de destino `70000002`; verificar `Bruno E*** M***`.
6. `browser_type` monto `150,50` y glosa `Almuerzo`; continuar a la confirmación.
7. `browser_type` PIN `1111`; `browser_click` "Confirmar".
8. `browser_wait_for` el comprobante; verificar con `browser_snapshot`:
   - número con formato `OP-AAAAMMDD-NNNNNN`,
   - destinatario `Bruno E*** M***`, monto `Bs 150,50`, glosa `Almuerzo`,
   - saldo resultante `Bs 4.849,50`.
9. `browser_evaluate` → sin desplazamiento horizontal.
10. `browser_take_screenshot` con `filename: "08-evidencias/TC-09-02/TC-09-02_comprobante.png"`.
11. Registrar en el reporte (ver `reporte-evidencias.md`).

Para un caso de varios usuarios (p. ej. TC-09-03), después del paso 8 cerrar sesión, ingresar como Bruno (`70000002` / `2222`) y verificar `Bs 950,50` y la transferencia recibida de `Ana F*** R***`.

## 6. Casos con tiempo y limitaciones

- **TC-04-01 y TC-04-02 (inactividad y renovación)** adelantan el reloj del navegador con `browser_run_code_unsafe`. El reloj se instala **antes** de cargar la app, para que los temporizadores de Angular lo usen:
  1. `browser_navigate` → `about:blank`.
  2. `browser_run_code_unsafe` con `async (page) => { await page.clock.install(); }`.
  3. `browser_navigate` → `http://localhost:4200`, reset e inicio de sesión como siempre.
  4. TC-04-01: sin interactuar, `browser_run_code_unsafe` con `async (page) => { await page.clock.runFor('05:01'); }` y verificar "Tu sesión se cerró por inactividad".
  5. TC-04-02: en el formulario de transferencia, alternar `browser_type` y `page.clock.runFor('01:00')` hasta superar 6 minutos simulados; enviar y verificar el comprobante.

  El reloj falso solo afecta al navegador: el JWT lo vence el **backend** con su hora real, así que en TC-04-02 lo que se prueba es que el frontend pidió `POST /api/auth/renovar` a tiempo (verificar con `browser_network_requests`). Si `page.clock` no se comporta como se espera, ejecutar la parte unitaria (Jest), marcar la parte E2E como **Bloqueado** con la causa y no esperar 5 minutos reales.
- **HU-12 (empresa lenta):** con `Servicios__TimeoutSegundos=2` el mensaje aparece en unos 4 s (dos intentos); usar `browser_wait_for` con ese texto en lugar de esperas fijas.
- **TC-02-01 y TC-02-05 (bloqueo):** el bloqueo dura 5 minutos reales; hacer reset antes del caso siguiente en lugar de esperar.
- **Fechas reales:** no afirmar "Vencida" sobre la deuda 2026-09 de LV-1001.
