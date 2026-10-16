# HU-12 · Informar cuando la empresa no responde

- **Épica:** Pago de servicios · **Prioridad:** Alta
- **Trazabilidad:** Especificación §7 · ADR-006, ADR-008

## Historia

**Como** usuario que consulta sus deudas,
**quiero** que, si la empresa no responde, el sistema me avise claramente y me deje reintentar,
**para** no quedarme esperando indefinidamente ni dudar de si se me cobró algo.

## Reglas de negocio

- Cada intento de consulta espera como máximo **10 segundos**.
- Si falla o vence, el backend **reintenta automáticamente una vez** (el usuario no lo nota).
- Si el reintento también falla, el usuario ve un mensaje de servicio no disponible y un botón **Reintentar**.
- Un fallo en la consulta **nunca** genera un débito.

## Criterios de aceptación

```gherkin
Característica: Empresa de servicios no disponible

  Antecedentes:
    Dado que inicié sesión como "70000001"
    Y elegí "Luz" y "Luz del Valle S.A."

  Escenario: CA-12.1 · La empresa no responde
    Dado que "Luz del Valle S.A." está configurada en modo "LENTO"
    Cuando consulto el código "LV-1001"
    Entonces veo "Consultando deudas…" mientras espero
    Y luego veo el mensaje "El servicio de Luz del Valle S.A. no está disponible. Intenta más tarde."
    Y veo el botón "Reintentar"
    Y mi saldo sigue siendo "Bs 5.000,00"

  Escenario: CA-12.2 · La empresa devuelve un error
    Dado que "Luz del Valle S.A." está configurada en modo "FALLA"
    Cuando consulto el código "LV-1001"
    Entonces veo el mensaje "El servicio de Luz del Valle S.A. no está disponible. Intenta más tarde."

  Escenario: CA-12.3 · Reintento manual exitoso
    Dado que vi el mensaje de servicio no disponible
    Y "Luz del Valle S.A." vuelve al modo "NORMAL"
    Cuando toco "Reintentar"
    Entonces veo las deudas de "LV-1001"

  Escenario: CA-12.4 · El reintento automático recupera una falla pasajera
    Dado que la primera consulta a "Luz del Valle S.A." falla y la segunda responde
    Cuando consulto el código "LV-1001"
    Entonces veo las deudas de "LV-1001" sin ningún mensaje de error
```

## Notas técnicas

- `ResiliencePipeline` de Polly v8 (*timeout* + *retry*) alrededor de `ConsultarDeudasAsync`; valores en `Servicios:TimeoutSegundos` y `Servicios:Reintentos`.
- Respuesta `503` con código `SERVICIO_NO_DISPONIBLE`.
- Modos del mock con `POST /api/test/empresas/comportamiento` (solo `Development`). En E2E se usa un timeout reducido (p. ej. 2 s).
- El último escenario se prueba a nivel de integración con un gateway falso que falla una sola vez.
