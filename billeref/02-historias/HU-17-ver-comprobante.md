# HU-17 · Ver el comprobante de una operación

- **Épica:** Historial · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.3, §3.4, §3.5 · ADR-001, ADR-002

## Historia

**Como** usuario de la billetera,
**quiero** abrir el comprobante de cualquier operación de mi historial,
**para** revisar sus detalles o mostrarlo como respaldo.

## Reglas de negocio

- Desde cada operación del historial (y de los últimos movimientos del inicio) se abre su comprobante.
- **Transferencia:** número de operación, fecha y hora, destinatario (o remitente, si fue recibida) enmascarado, monto, glosa y **saldo resultante del usuario que consulta**.
- **Pago de servicio:** número de operación, fecha y hora, empresa, código de cliente, periodo, monto, comisión y saldo resultante.
- Solo el origen o el destino de una operación pueden ver su comprobante; el destinatario nunca ve el saldo de quien envió.

## Criterios de aceptación

```gherkin
Característica: Ver comprobante

  Escenario: CA-17.1 · Comprobante de una transferencia enviada
    Dado que "70000001" transfirió Bs 150,50 a "70000002" con la glosa "Almuerzo"
    Cuando "70000001" abre esa operación desde su historial
    Entonces ve el número de operación, la fecha y hora, el destinatario "Bruno E*** M***", el monto "Bs 150,50", la glosa "Almuerzo" y el saldo resultante "Bs 4.849,50"

  Escenario: CA-17.2 · Comprobante de una transferencia recibida
    Dado que "70000001" transfirió Bs 150,50 a "70000002" con la glosa "Almuerzo"
    Cuando "70000002" abre esa operación desde su historial
    Entonces ve el remitente "Ana F*** R***", el monto "Bs 150,50" y el saldo resultante "Bs 950,50"
    Y no ve el saldo de "70000001"

  Escenario: CA-17.3 · Comprobante de un pago de servicio
    Dado que "70000001" pagó la deuda 2026-08 de "LV-1001"
    Cuando abre esa operación desde su historial
    Entonces ve la empresa "Luz del Valle S.A.", el código "LV-1001", el periodo "2026-08", el monto "Bs 185,40", la comisión "Bs 1,00" y el saldo resultante "Bs 4.813,60"

  Escenario: CA-17.4 · No se puede ver el comprobante de otro usuario
    Dado que "70000001" transfirió Bs 150,50 a "70000002"
    Cuando "70000003" pide ese comprobante a la API por su número de operación
    Entonces la respuesta es "404"

  Escenario: CA-17.5 · Abrir el comprobante desde el inicio
    Dado que "70000001" transfirió Bs 150,50 a "70000002"
    Cuando "70000001" toca ese movimiento en la pantalla de inicio
    Entonces ve el mismo comprobante que desde el historial
```

## Notas técnicas

- `GET /api/operaciones/{numero}/comprobante`; `404` si el usuario no es origen ni destino (no se revela que la operación existe).
- El número de operación puede ir en la URL: no es un dato sensible.
- El comprobante de una transferencia usa `saldoResultanteOrigen` o `saldoResultanteDestino` según quién consulta.
