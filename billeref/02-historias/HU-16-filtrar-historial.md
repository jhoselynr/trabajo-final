# HU-16 · Filtrar el historial por tipo y fechas

- **Épica:** Historial · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.5 · ADR-005, ADR-001

## Historia

**Como** usuario de la billetera,
**quiero** filtrar mi historial por tipo de operación y por rango de fechas,
**para** encontrar rápidamente una operación concreta.

## Reglas de negocio

- Filtro por tipo: Todas, Transferencias enviadas, Transferencias recibidas, Pagos de servicios.
- Filtro por fechas: "desde" y "hasta", ambos opcionales e **inclusivos**, en fechas calendario de Bolivia.
- "Hasta" incluye todo ese día, hasta las 23:59:59 hora de Bolivia.
- "Desde" no puede ser posterior a "Hasta".
- Los filtros se pueden combinar; el orden sigue siendo del más reciente al más antiguo.

## Criterios de aceptación

```gherkin
Característica: Filtrar historial

  Antecedentes:
    Dado que inicié sesión como "70000001"
    Y tengo estas operaciones (hora de Bolivia):
      | fecha            | tipo                   | monto      |
      | 13/10/2026 10:00 | Transferencia enviada  | -Bs 100,00 |
      | 14/10/2026 23:59 | Transferencia recibida | +Bs 50,00  |
      | 15/10/2026 00:00 | Pago de servicio       | -Bs 186,40 |

  Escenario: CA-16.1 · Filtrar por tipo
    Cuando filtro por "Transferencias enviadas"
    Entonces veo solo la operación del 13/10/2026

  Escenario: CA-16.2 · Filtrar por rango de fechas inclusivo
    Cuando filtro desde "14/10/2026" hasta "14/10/2026"
    Entonces veo solo la transferencia recibida del 14/10/2026 23:59

  Escenario: CA-16.3 · El límite del día se toma en hora de Bolivia
    Cuando filtro desde "15/10/2026" hasta "15/10/2026"
    Entonces veo solo el pago del 15/10/2026 00:00

  Escenario: CA-16.4 · Combinar tipo y fechas
    Cuando filtro por "Pagos de servicios" desde "13/10/2026" hasta "14/10/2026"
    Entonces veo el mensaje "No hay operaciones para los filtros elegidos"

  Escenario: CA-16.5 · Rango de fechas inválido
    Cuando filtro desde "15/10/2026" hasta "13/10/2026"
    Entonces veo el mensaje "La fecha inicial no puede ser posterior a la final"

  Escenario: CA-16.6 · Quitar los filtros
    Dado que filtré por "Transferencias enviadas"
    Cuando elijo "Todas" y borro las fechas
    Entonces veo las 3 operaciones

  Escenario: CA-16.7 · Solo fecha inicial
    Cuando filtro desde "14/10/2026" sin fecha final
    Entonces veo la transferencia recibida del 14/10/2026 23:59 y el pago del 15/10/2026 00:00
```

## Notas técnicas

- `GET /api/historial?tipo=&desde=&hasta=` con fechas `AAAA-MM-DD`; `tipo` vacío = todos.
- Conversión de los límites a UTC: `desde 00:00:00−04:00` y `hasta 23:59:59.9999999−04:00` (ADR-005).
- Código `RANGO_FECHAS_INVALIDO`. Los datos del antecedente se preparan con `FakeTimeProvider` en pruebas de integración.
