# HU-09 · Confirmar la transferencia con PIN y obtener el comprobante

- **Épica:** Transferencias · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.3 · ADR-002, ADR-003 · Supuesto S-01

## Historia

**Como** usuario que quiere transferir dinero,
**quiero** revisar los datos, confirmar con mi PIN y recibir un comprobante,
**para** tener la seguridad de que la transferencia se hizo y poder demostrarlo.

## Reglas de negocio

- Antes de confirmar se muestran: nombre enmascarado del destinatario, monto y glosa.
- La transferencia se confirma con el PIN; un PIN incorrecto cuenta para el bloqueo (HU-02).
- El débito al origen, el crédito al destino y el registro de la operación ocurren **juntos o no ocurren**.
- El comprobante incluye: número de operación (`OP-AAAAMMDD-NNNNNN`), fecha y hora, destinatario, monto, glosa y **saldo resultante** del usuario.
- La operación aparece en el historial de ambos usuarios.

## Criterios de aceptación

```gherkin
Característica: Confirmar transferencia

  Antecedentes:
    Dado que inicié sesión como "70000001"
    Y elegí como destinatario a "70000002"
    Y ingresé el monto "150,50" y la glosa "Almuerzo"

  Escenario: CA-09.1 · Pantalla de confirmación
    Cuando paso a la confirmación
    Entonces veo el destinatario "Bruno E*** M***"
    Y veo el monto "Bs 150,50"
    Y veo la glosa "Almuerzo"
    Y se me pide el PIN

  Escenario: CA-09.2 · Transferencia exitosa
    Cuando confirmo con mi PIN "1111"
    Entonces veo un comprobante con un número de operación con formato "OP-AAAAMMDD-NNNNNN"
    Y el comprobante muestra la fecha y hora en hora de Bolivia
    Y el comprobante muestra el destinatario "Bruno E*** M***", el monto "Bs 150,50" y la glosa "Almuerzo"
    Y el comprobante muestra el saldo resultante "Bs 4.849,50"

  Escenario: CA-09.3 · Se refleja en ambos usuarios
    Dado que confirmé la transferencia con mi PIN "1111"
    Cuando "70000002" inicia sesión
    Entonces su saldo es "Bs 950,50"
    Y ve la transferencia recibida de "Ana F*** R***" por "Bs 150,50"

  Escenario: CA-09.4 · PIN incorrecto no realiza la transferencia
    Cuando confirmo con el PIN "0000"
    Entonces veo el mensaje "PIN incorrecto. Te quedan 2 intentos."
    Y mi saldo sigue siendo "Bs 5.000,00"
    Y puedo volver a ingresar el PIN sin rehacer la transferencia

  Escenario: CA-09.5 · Cancelar en la confirmación
    Cuando toco "Cancelar" en la pantalla de confirmación
    Entonces vuelvo al inicio
    Y mi saldo sigue siendo "Bs 5.000,00"

  Escenario: CA-09.6 · Atomicidad ante un fallo interno
    Dado que el registro de la operación falla por un error interno
    Cuando confirmo con mi PIN "1111"
    Entonces veo un mensaje de error genérico
    Y ni mi saldo ni el de "70000002" cambiaron
    Y la operación no aparece en ningún historial
```

## Notas técnicas

- `POST /api/transferencias` con cabecera `Idempotency-Key` y cuerpo `{celularDestino, monto, glosa, pin}`.
- Orden de procesamiento de ADR-002: PIN fuera del lock; reglas y aplicación dentro de la sección crítica.
- Se guardan `saldoResultanteOrigen` y `saldoResultanteDestino` por separado.
- El escenario de atomicidad se prueba a nivel de integración, inyectando una falla en el repositorio.
