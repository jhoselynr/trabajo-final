# HU-11 · Consultar las deudas de un código de cliente

- **Épica:** Pago de servicios · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.4 · ADR-006 · Supuesto SH-03

## Historia

**Como** usuario que quiere pagar un servicio básico,
**quiero** elegir el servicio y la empresa, escribir mi código de cliente y ver mis deudas pendientes,
**para** saber cuánto debo y qué periodo me toca pagar.

## Reglas de negocio

- El flujo es: tipo de servicio (luz, agua o internet) → empresa de ese tipo → código de cliente.
- El código debe existir en la empresa elegida.
- Se muestran las deudas pendientes con periodo, monto y fecha de vencimiento, ordenadas de la más antigua a la más reciente.
- Solo la **más antigua** se puede seleccionar; las demás aparecen deshabilitadas con el texto "Paga primero el periodo {periodo}".
- Las deudas vencidas se pueden pagar y se marcan como "Vencida" (SH-03).

## Criterios de aceptación

```gherkin
Característica: Consultar deudas

  Antecedentes:
    Dado que inicié sesión como "70000001"
    Y estoy en la pantalla de pago de servicios

  Escenario: CA-11.1 · Empresas según el tipo de servicio
    Cuando elijo el servicio "Luz"
    Entonces veo la empresa "Luz del Valle S.A."
    Y no veo las empresas de agua ni de internet

  Escenario: CA-11.2 · Código con varias deudas
    Dado que elegí "Luz" y "Luz del Valle S.A."
    Cuando consulto el código "LV-1001"
    Entonces veo la deuda 2026-08 de "Bs 185,40" que vence el 15/09/2026, marcada como "Vencida" y seleccionable
    Y veo la deuda 2026-09 de "Bs 172,10" que vence el 15/10/2026, deshabilitada con el texto "Paga primero el periodo 2026-08"

  Escenario: CA-11.3 · Código con una deuda
    Dado que elegí "Agua" y "Aguas Claras"
    Cuando consulto el código "AC-2002"
    Entonces veo la deuda 2026-09 de "Bs 64,00" que vence el 20/10/2026, seleccionable

  Escenario: CA-11.4 · Código sin deudas
    Dado que elegí "Internet" y "NetAndes"
    Cuando consulto el código "NA-3004"
    Entonces veo el mensaje "No tienes deudas pendientes con NetAndes"

  Escenario: CA-11.5 · Código inexistente
    Dado que elegí "Luz" y "Luz del Valle S.A."
    Cuando consulto el código "LV-9999"
    Entonces veo el mensaje "El código de cliente no existe en Luz del Valle S.A."

  Escenario: CA-11.6 · Código de otra empresa
    Dado que elegí "Luz" y "Luz del Valle S.A."
    Cuando consulto el código "AC-2002"
    Entonces veo el mensaje "El código de cliente no existe en Luz del Valle S.A."

  Escenario: CA-11.7 · Indicador de carga
    Dado que elegí "Luz" y "Luz del Valle S.A."
    Cuando consulto el código "LV-1001"
    Entonces veo "Consultando deudas…" mientras espero la respuesta
```

## Notas técnicas

- `GET /api/servicios` (tipos y empresas) y `POST /api/servicios/deudas` con cuerpo `{empresaId, codigoCliente}`.
- La consulta pasa por `IEmpresaServiciosGateway` con timeout y reintento (HU-12).
- "Vencida" se calcula contra la fecha actual de Bolivia: vencimiento anterior a hoy.
- Código `CODIGO_CLIENTE_INEXISTENTE`.
