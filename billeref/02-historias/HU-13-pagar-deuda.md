# HU-13 · Pagar la deuda más antigua con comisión

- **Épica:** Pago de servicios · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.4 · ADR-002, ADR-005, ADR-006 · Supuesto S-05

## Historia

**Como** usuario con deudas de servicios,
**quiero** pagar mi deuda pendiente más antigua, conociendo la comisión antes de confirmar,
**para** mantener mis servicios al día sin sorpresas en el cobro.

## Reglas de negocio

- Se paga **una** deuda, por su **monto total**; no hay pagos parciales.
- Si hay varias deudas, solo se puede pagar **la más antigua**.
- Comisión fija de **Bs 1,00** por pago, mostrada antes de confirmar.
- El saldo debe cubrir **monto + comisión**.
- Se confirma con el PIN; un PIN incorrecto cuenta para el bloqueo (HU-02).
- El débito, la marca de deuda pagada y el registro de la operación ocurren **juntos o no ocurren**.
- El comprobante incluye: número de operación, empresa, código de cliente, periodo, monto, comisión y saldo resultante.

## Criterios de aceptación

```gherkin
Característica: Pagar una deuda de servicio

  Escenario: CA-13.1 · Pantalla de confirmación del pago
    Dado que inicié sesión como "70000001"
    Y seleccioné la deuda 2026-08 de "LV-1001" de "Luz del Valle S.A."
    Cuando paso a la confirmación
    Entonces veo la empresa "Luz del Valle S.A.", el código "LV-1001" y el periodo "2026-08"
    Y veo el monto "Bs 185,40", la comisión "Bs 1,00" y el total "Bs 186,40"
    Y se me pide el PIN

  Escenario: CA-13.2 · Pago exitoso
    Dado que inicié sesión como "70000001"
    Y estoy en la confirmación del pago de la deuda 2026-08 de "LV-1001"
    Cuando confirmo con mi PIN "1111"
    Entonces veo un comprobante con número de operación, empresa "Luz del Valle S.A.", código "LV-1001", periodo "2026-08", monto "Bs 185,40", comisión "Bs 1,00" y saldo resultante "Bs 4.813,60"

  Escenario: CA-13.3 · Tras pagar la más antigua se habilita la siguiente
    Dado que "70000001" pagó la deuda 2026-08 de "LV-1001"
    Cuando consulto el código "LV-1001" de "Luz del Valle S.A."
    Entonces veo solo la deuda 2026-09 de "Bs 172,10", seleccionable

  Escenario: CA-13.4 · No se puede pagar una deuda que no es la más antigua
    Dado que inicié sesión como "70000001"
    Cuando envío a la API el pago de la deuda 2026-09 de "LV-1001"
    Entonces la respuesta tiene el código "DEUDA_NO_ES_LA_MAS_ANTIGUA" y el mensaje "Paga primero el periodo 2026-08"
    Y mi saldo sigue siendo "Bs 5.000,00"

  Escenario: CA-13.5 · Saldo insuficiente para monto más comisión
    Dado que inicié sesión como "70000003" con saldo "Bs 0,00"
    Y estoy en la confirmación del pago de la deuda 2026-09 de "AC-2002"
    Cuando confirmo con mi PIN "3333"
    Entonces veo el mensaje "Saldo insuficiente"
    Y la deuda sigue pendiente

  Escenario: CA-13.6 · Saldo que cubre el monto pero no la comisión
    Dado que tengo saldo "Bs 64,00"
    Y estoy en la confirmación del pago de la deuda 2026-09 de "AC-2002" por "Bs 64,00"
    Cuando confirmo con mi PIN
    Entonces veo el mensaje "Saldo insuficiente"

  Escenario: CA-13.7 · PIN incorrecto no realiza el pago
    Dado que inicié sesión como "70000002"
    Y estoy en la confirmación del pago de la deuda 2026-10 de "NA-3003"
    Cuando confirmo con el PIN "0000"
    Entonces veo el mensaje "PIN incorrecto. Te quedan 2 intentos."
    Y mi saldo sigue siendo "Bs 800,00"
    Y la deuda sigue pendiente

  Escenario: CA-13.8 · Atomicidad ante un fallo interno
    Dado que inicié sesión como "70000001"
    Y el registro de la operación falla por un error interno
    Cuando confirmo el pago de la deuda 2026-08 de "LV-1001" con mi PIN "1111"
    Entonces veo un mensaje de error genérico
    Y mi saldo sigue siendo "Bs 5.000,00"
    Y la deuda sigue pendiente

  Escenario: CA-13.9 · El monto lo define la deuda, no la solicitud
    Dado que inicié sesión como "70000001"
    Cuando envío a la API el pago de la deuda 2026-08 de "LV-1001" con un campo extra "monto" igual a "1.00"
    Entonces se debita "Bs 186,40"
```

## Notas técnicas

- `POST /api/pagos` con cabecera `Idempotency-Key` y cuerpo `{empresaId, codigoCliente, periodo, pin}`. **El monto no lo envía el cliente**: se toma de `IDeudaRepository`.
- Validaciones del pago leyendo `IDeudaRepository` dentro de la sección crítica, sin pasar por el gateway ni el timeout (ADR-006).
- El pago no suma al límite diario de transferencias (S-05).
- El escenario "cubre el monto pero no la comisión" se prueba en integración con un saldo preparado.
