# HU-08 · Respetar los límites por transferencia y diario

- **Épica:** Transferencias · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.3, §7 · ADR-005, ADR-002 · Supuesto S-04

## Historia

**Como** usuario de la billetera,
**quiero** que el sistema limite cuánto puedo transferir por operación y por día,
**para** reducir el daño si alguien usa mi cuenta sin permiso.

## Reglas de negocio

- Máximo **Bs 3.000,00 por transferencia** (inclusivo).
- Máximo **Bs 10.000,00 transferidos por día** (inclusivo), sumando solo transferencias **enviadas y exitosas**.
- El día es el **día calendario en hora de Bolivia** (00:00:00 a 23:59:59, UTC−4); el acumulado se reinicia a medianoche.
- No suman al límite diario: transferencias recibidas, pagos de servicios ni comisiones.
- Si una transferencia supera el límite diario, se rechaza completa; no se transfiere una parte.
- Dos transferencias simultáneas no pueden superar juntas el límite.

## Criterios de aceptación

```gherkin
Característica: Límites de transferencia

  Antecedentes:
    Dado que inicié sesión como "70000001"
    Y elegí como destinatario a "70000002"

  Escenario: CA-08.1 · Monto igual al límite por transferencia
    Cuando transfiero "3000" y confirmo con mi PIN "1111"
    Entonces la transferencia se realiza

  Escenario: CA-08.2 · Monto mayor al límite por transferencia
    Cuando ingreso el monto "3000,01"
    Entonces veo el mensaje "El monto máximo por transferencia es Bs 3.000,00"
    Y no puedo continuar

  Escenario: CA-08.3 · Llegar exactamente al límite diario
    Dado que hoy ya transferí Bs 9.000,00
    Y tengo saldo suficiente
    Cuando transfiero "1000" y confirmo con mi PIN "1111"
    Entonces la transferencia se realiza

  Escenario: CA-08.4 · Superar el límite diario
    Dado que hoy ya transferí Bs 9.000,00
    Y tengo saldo suficiente
    Cuando transfiero "1000,01" y confirmo con mi PIN "1111"
    Entonces veo el mensaje "Superas el límite diario de Bs 10.000. Disponible hoy: Bs 1.000,00"
    Y no se debita nada de mi saldo

  Escenario: CA-08.5 · El límite se reinicia a medianoche de Bolivia
    Dado que el 15/10/2026 a las 23:59 hora de Bolivia ya había transferido Bs 10.000,00
    Cuando el 16/10/2026 a las 00:00 hora de Bolivia transfiero "100"
    Entonces la transferencia se realiza

  Escenario: CA-08.6 · Las transferencias recibidas y los pagos no cuentan
    Dado que hoy ya transferí Bs 9.000,00
    Y hoy también recibí Bs 3.000,00 y pagué un servicio de Bs 185,40
    Y tengo saldo suficiente
    Cuando transfiero "1000" y confirmo con mi PIN "1111"
    Entonces la transferencia se realiza

  Escenario: CA-08.7 · Dos transferencias simultáneas no superan juntas el límite
    Dado que hoy ya transferí Bs 8.000,00
    Y tengo saldo suficiente
    Cuando envío al mismo tiempo dos transferencias de "1500" con claves distintas
    Entonces solo una se realiza
    Y la otra recibe el mensaje "Superas el límite diario de Bs 10.000. Disponible hoy: Bs 500,00"

  Escenario: CA-08.8 · Monto con demasiados dígitos
    Cuando ingreso el monto "12345678"
    Entonces veo el mensaje "El monto máximo por transferencia es Bs 3.000,00"
```

## Notas técnicas

- Límite por transferencia: validable en el frontend y obligatorio en el backend (`LIMITE_POR_TRANSFERENCIA`).
- Límite diario: solo en el backend, dentro de la sección crítica (ADR-002); código `LIMITE_DIARIO`.
- Los escenarios del límite diario y la medianoche se prueban con `FakeTimeProvider` y datos preparados en pruebas de integración; con la semilla se alcanzan haciendo circular dinero entre Ana y Bruno.
