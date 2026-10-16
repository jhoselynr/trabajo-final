# HU-04 · Cierre de sesión por inactividad, recarga o voluntad del usuario

- **Épica:** Acceso · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.1 · ADR-003 · Supuestos S-08, SH-02

## Historia

**Como** usuario de la billetera,
**quiero** que mi sesión se cierre si dejo de usar la app, si recargo la página o cuando yo lo decida,
**para** que nadie pueda operar con mi cuenta si dejo el celular desatendido.

## Reglas de negocio

- La sesión se cierra tras **5 minutos sin interacción** del usuario (toques, teclado, navegación).
- Mientras el usuario interactúa, la sesión se mantiene aunque no haga peticiones al servidor.
- **Recargar la página** cierra la sesión y exige volver a ingresar.
- El usuario puede cerrar sesión con el botón **Cerrar sesión** (SH-02).
- Una sesión cerrada no puede reutilizarse: cualquier petición con ese token responde `401`.

## Criterios de aceptación

```gherkin
Característica: Cierre de sesión

  Escenario: CA-04.1 · Cierre por inactividad
    Dado que inicié sesión como "70000001"
    Cuando pasan 5 minutos sin que interactúe con la aplicación
    Entonces veo la pantalla de ingreso con el mensaje "Tu sesión se cerró por inactividad"

  Escenario: CA-04.2 · La actividad mantiene la sesión abierta
    Dado que inicié sesión como "70000001"
    Y estoy en el formulario de transferencia
    Cuando escribo en el formulario durante 6 minutos sin enviarlo
    Y envío el formulario
    Entonces la solicitud se procesa sin pedirme que ingrese de nuevo

  Escenario: CA-04.3 · Recargar la página cierra la sesión
    Dado que inicié sesión como "70000001"
    Cuando recargo la página
    Entonces veo la pantalla de ingreso

  Escenario: CA-04.4 · Cerrar sesión voluntariamente
    Dado que inicié sesión como "70000001"
    Cuando toco "Cerrar sesión"
    Entonces veo la pantalla de ingreso
    Y el token anterior ya no permite consultar el saldo

  Escenario: CA-04.5 · Pantallas protegidas sin sesión
    Dado que no inicié sesión
    Cuando intento abrir la pantalla de historial
    Entonces veo la pantalla de ingreso

  Escenario: CA-04.6 · Sesión vencida en el servidor
    Dado que inicié sesión como "70000001"
    Y mi token venció en el servidor sin que el frontend lo detectara
    Cuando abro el historial
    Entonces veo la pantalla de ingreso con el mensaje "Tu sesión expiró. Ingresa nuevamente."
```

## Notas técnicas

- Temporizador de inactividad en Angular (5 min); al vencer llama `POST /api/auth/logout`.
- Si el usuario está activo y al JWT le queda menos de 1 minuto, el frontend llama `POST /api/auth/renovar`.
- Cada respuesta autenticada trae `X-Renewed-Token`; el *interceptor* lo reemplaza.
- Logout revoca el `sid` en el backend.
- Pruebas con reloj falso: `jest.useFakeTimers()` y `page.clock` de Playwright (ADR-008).
