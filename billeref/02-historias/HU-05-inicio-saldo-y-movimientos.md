# HU-05 · Ver saldo y últimos 5 movimientos

- **Épica:** Inicio · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.2 · ADR-005 · Supuesto SH-06

## Historia

**Como** usuario de la billetera,
**quiero** ver mi nombre, mi saldo disponible y mis últimos movimientos apenas ingreso,
**para** saber cuánto dinero tengo y qué operaciones hice recientemente.

## Reglas de negocio

- Se muestran el nombre completo del usuario, el saldo disponible y los **5 últimos** movimientos.
- Los movimientos incluyen transferencias enviadas, recibidas y pagos de servicios, del más reciente al más antiguo.
- Cada movimiento muestra tipo, contraparte (nombre enmascarado o empresa), fecha y hora, y monto: negativo si es débito, positivo si es crédito.
- Desde el inicio se accede a Transferir, Pagar servicios, Historial y Cerrar sesión.

## Criterios de aceptación

```gherkin
Característica: Pantalla de inicio

  Escenario: CA-05.1 · Usuario sin movimientos
    Dado que inicié sesión como "70000001"
    Cuando veo la pantalla de inicio
    Entonces veo el nombre "Ana Ficticia Rojas"
    Y veo el saldo "Bs 5.000,00"
    Y veo el mensaje "Aún no tienes movimientos"

  Escenario: CA-05.2 · Usuario con saldo cero
    Dado que inicié sesión como "70000003"
    Cuando veo la pantalla de inicio
    Entonces veo el saldo "Bs 0,00"

  Escenario: CA-05.3 · Solo se muestran los 5 movimientos más recientes
    Dado que "70000001" realizó 7 transferencias de Bs 10,00 a "70000002"
    Cuando inicio sesión como "70000001"
    Entonces veo exactamente 5 movimientos
    Y el primero es la transferencia más reciente
    Y veo el saldo "Bs 4.930,00"

  Escenario: CA-05.4 · Se muestran movimientos enviados, recibidos y pagos
    Dado que "70000001" transfirió Bs 150,50 a "70000002"
    Y "70000002" pagó la deuda 2026-10 de "NA-3003" de NetAndes
    Cuando inicio sesión como "70000002"
    Entonces veo un movimiento "Transferencia recibida" de "Ana F*** R***" por "+Bs 150,50"
    Y veo un movimiento "Pago de servicio" a "NetAndes" por "-Bs 250,00"
    Y el pago aparece primero

  Escenario: CA-05.5 · Accesos desde el inicio
    Dado que inicié sesión como "70000001"
    Cuando veo la pantalla de inicio
    Entonces veo los accesos "Transferir", "Pagar servicios", "Historial" y "Cerrar sesión"
```

## Notas técnicas

- `GET /api/inicio` devuelve `{nombre, saldo, movimientos[5]}`.
- El monto de un pago en la lista es el total debitado (deuda + comisión).
- Fechas en hora de Bolivia, `dd/MM/aaaa HH:mm` (CT-02).
