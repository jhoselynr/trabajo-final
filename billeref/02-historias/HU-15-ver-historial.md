# HU-15 · Ver el historial de operaciones

- **Épica:** Historial · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.5 · ADR-002, ADR-005 · Supuestos SH-04, SH-05, SH-06

## Historia

**Como** usuario de la billetera,
**quiero** ver todas mis transferencias enviadas, recibidas y mis pagos de servicios,
**para** llevar el control de mi dinero.

## Reglas de negocio

- Lista transferencias enviadas, transferencias recibidas y pagos de servicios del usuario.
- Orden: del más reciente al más antiguo.
- Cada operación muestra: tipo, contraparte (nombre enmascarado o empresa), fecha y hora, y monto con signo.
- Un usuario solo ve sus propias operaciones.
- Sin paginación (SH-04).

## Criterios de aceptación

```gherkin
Característica: Historial de operaciones

  Escenario: CA-15.1 · Historial vacío
    Dado que inicié sesión como "70000003"
    Cuando abro el historial
    Entonces veo el mensaje "Aún no tienes movimientos"

  Escenario: CA-15.2 · Historial con distintos tipos ordenado por fecha
    Dado que "70000001" transfirió Bs 150,50 a "70000002"
    Y luego "70000002" transfirió Bs 50,00 a "70000001"
    Y luego "70000001" pagó la deuda 2026-08 de "LV-1001"
    Cuando "70000001" abre el historial
    Entonces veo 3 operaciones en este orden:
      | tipo                   | contraparte        | monto        |
      | Pago de servicio       | Luz del Valle S.A. | -Bs 186,40   |
      | Transferencia recibida | Bruno E*** M***    | +Bs 50,00    |
      | Transferencia enviada  | Bruno E*** M***    | -Bs 150,50   |

  Escenario: CA-15.3 · No se ven operaciones de otros usuarios
    Dado que "70000001" transfirió Bs 100,00 a "70000002"
    Cuando "70000003" abre el historial
    Entonces veo el mensaje "Aún no tienes movimientos"
```

## Notas técnicas

- `GET /api/historial` (sin filtros = todo, SH-05).
- Tipos: `TRANSFERENCIA_ENVIADA`, `TRANSFERENCIA_RECIBIDA`, `PAGO_SERVICIO`; el tipo de una transferencia se deriva según quién consulta (ADR-002).
- El monto de un pago es el total debitado (deuda + comisión).
