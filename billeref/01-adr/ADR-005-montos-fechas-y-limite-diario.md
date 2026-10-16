# ADR-005 · Montos con `decimal`, hora de Bolivia y cálculo del límite diario

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Relacionados:** ADR-001, ADR-002

## Contexto

§5 exige montos con 2 decimales y sin errores de redondeo, y fechas en hora de Bolivia (UTC−4). §3.3 fija un límite de Bs 3.000 por transferencia y de Bs 10.000 por día, y §7 pregunta cómo se calcula el "día".

## Decisión

### Montos
- En el backend todos los montos son **`decimal`** de C# (nunca `double`/`float`).
- En el JSON de la API los montos viajan como **cadena** con punto decimal (`"185.40"`) para que JavaScript no los convierta a coma flotante. En Angular se tratan como cadena o como enteros en centavos para validar; el cálculo de saldos solo lo hace el backend.
- **Validación, no redondeo:** un monto con más de 2 decimales se **rechaza** ("El monto admite como máximo 2 decimales"); el sistema nunca redondea lo que ingresa el usuario.
- El monto debe ser `> 0`. La comisión de pago es la constante `1.00m`.
- **Presentación:** formato boliviano `Bs 1.234,50` (punto de miles, coma decimal), con `es-BO` en Angular.

### Fechas y zona horaria
- Las operaciones se registran en **UTC** (`DateTimeOffset`).
- Se convierten a **hora de Bolivia (UTC−4, desplazamiento fijo, Bolivia no tiene horario de verano)** para mostrarlas, filtrar el historial y calcular el día.
- El reloj se obtiene de `TimeProvider` (inyectado), para poder fijar la hora en pruebas.
- Los filtros de fecha del historial (`desde`, `hasta`) son fechas calendario de Bolivia e **inclusivas** (`hasta` incluye todo ese día hasta las 23:59:59).

### Límite diario
- El "día" es el **día calendario en hora de Bolivia**: de 00:00:00 a 23:59:59 (UTC−4). El acumulado se reinicia a medianoche de Bolivia.
- El acumulado suma solo **transferencias enviadas y exitosas** del usuario en ese día. No suman las transferencias recibidas, los pagos de servicios ni sus comisiones.
- El máximo diario es **Bs 10.000,00** (requisito confirmado). La validación es: `acumuladoDelDia + montoNuevo <= 10.000,00`; si la nueva transferencia lo supera, se rechaza completa (no se transfiere una parte) con el mensaje "Superas el límite diario de Bs 10.000. Disponible hoy: Bs X".
- La validación se hace dentro de la sección crítica de ADR-002, para que dos transferencias simultáneas no superen el límite entre las dos.

## Alternativas consideradas

- **Ventana móvil de 24 horas:** más difícil de explicar al usuario ("¿cuándo puedo volver a transferir?").
- **Montos como `number` en JSON:** riesgo de errores de coma flotante en el cliente.
- **Redondear montos con más de 2 decimales:** modificaría en silencio lo que el usuario quiso enviar.

## Consecuencias

- **Positivas:** aritmética exacta; regla de límite diaria predecible; pruebas deterministas gracias a `TimeProvider`.
- **Negativas:** los montos como cadena exigen conversión explícita en el cliente.
- **Casos de prueba derivados:** transferencia a las 23:59 y a las 00:00 de Bolivia; acumulado exacto de Bs 10.000; montos `0`, `0.001`, `3000.00`, `3000.01`.
