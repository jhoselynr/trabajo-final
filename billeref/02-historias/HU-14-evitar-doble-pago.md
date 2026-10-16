# HU-14 · Evitar el doble pago de una deuda

- **Épica:** Pago de servicios · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.4, §7 · ADR-004, ADR-006

## Historia

**Como** usuario que paga un servicio,
**quiero** que una deuda no se pueda pagar dos veces, ni por un doble envío ni por un nuevo intento,
**para** no pagar de más.

## Reglas de negocio

- Una deuda ya pagada no se puede volver a pagar.
- Un doble envío con la misma clave de idempotencia devuelve el mismo comprobante sin un segundo débito.
- Un intento nuevo (otra clave) sobre una deuda ya pagada se rechaza.

## Criterios de aceptación

```gherkin
Característica: Evitar el doble pago

  Antecedentes:
    Dado que inicié sesión como "70000002"
    Y estoy en la confirmación del pago de la deuda 2026-10 de "NA-3003" por "Bs 249,00"

  Escenario: CA-14.1 · Doble toque en "Confirmar"
    Cuando toco "Confirmar" dos veces seguidas con mi PIN "2222"
    Entonces se debita una sola vez "Bs 250,00"
    Y mi saldo es "Bs 550,00"
    Y el historial muestra un solo pago

  Escenario: CA-14.2 · Reintento con la misma clave
    Dado que confirmé con mi PIN "2222" y la respuesta se perdió por la red
    Cuando la aplicación reenvía la misma solicitud con la misma clave
    Entonces recibo el mismo número de operación
    Y mi saldo es "Bs 550,00"

  Escenario: CA-14.3 · Intento nuevo sobre una deuda ya pagada
    Dado que ya pagué la deuda 2026-10 de "NA-3003"
    Cuando envío a la API un nuevo pago de esa deuda con otra clave
    Entonces la respuesta tiene el código "DEUDA_YA_PAGADA" y el mensaje "Esta deuda ya fue pagada"
    Y mi saldo sigue siendo "Bs 550,00"

  Escenario: CA-14.4 · Deuda pagada desaparece de la consulta
    Dado que ya pagué la deuda 2026-10 de "NA-3003"
    Cuando consulto el código "NA-3003" de "NetAndes"
    Entonces veo el mensaje "No tienes deudas pendientes con NetAndes"

  Escenario: CA-14.5 · Dos pagos simultáneos de la misma deuda con claves distintas
    Cuando se envían al mismo tiempo dos pagos de la deuda 2026-10 de "NA-3003" con claves distintas
    Entonces solo uno se realiza
    Y el otro recibe el código "DEUDA_YA_PAGADA"
    Y mi saldo es "Bs 550,00"
```

## Notas técnicas

- Misma mecánica de idempotencia que HU-10; huella SHA-256 de `{empresaId, codigoCliente, periodo}` sin el PIN.
- La verificación de "deuda pendiente" se hace dentro de la sección crítica, así dos pagos concurrentes con claves distintas no pueden pagar la misma deuda.
