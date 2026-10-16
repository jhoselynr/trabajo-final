# HU-03 · Ingreso de un usuario con cuenta bloqueada

- **Épica:** Acceso · **Prioridad:** Alta
- **Trazabilidad:** Especificación §4 (usuario 70000004), §7 · ADR-003

## Historia

**Como** usuario cuya cuenta está bloqueada,
**quiero** saber que mi cuenta está bloqueada cuando ingreso mis datos correctos,
**para** saber que debo comunicarme con soporte en lugar de seguir intentando.

## Reglas de negocio

- El PIN se valida **antes** de informar el bloqueo.
- Con PIN correcto se informa el bloqueo y no se crea sesión; el contador de intentos se reinicia.
- Con PIN incorrecto se responde el mismo error genérico que a cualquier usuario y cuenta para el bloqueo temporal (HU-02).
- Una cuenta bloqueada tampoco puede recibir transferencias (HU-06).

## Criterios de aceptación

```gherkin
Característica: Ingreso de un usuario con cuenta bloqueada

  Escenario: CA-03.1 · Cuenta bloqueada con PIN correcto
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "70000004" y el PIN "4444"
    Entonces veo el mensaje "Tu cuenta está bloqueada. Comunícate con soporte."
    Y sigo en la pantalla de ingreso

  Escenario: CA-03.2 · Cuenta bloqueada con PIN incorrecto no revela el bloqueo
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "70000004" y el PIN "0000"
    Entonces veo el mensaje "Celular o PIN incorrectos"

  Escenario: CA-03.3 · Cuenta bloqueada también acumula intentos fallidos
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "70000004" con el PIN "0000" tres veces seguidas
    Entonces veo el mensaje "Demasiados intentos. Intenta nuevamente en 5 minutos."

  Escenario: CA-03.4 · Con PIN correcto se reinicia el contador
    Dado que ingresé el celular "70000004" con un PIN incorrecto dos veces
    Y luego ingresé el PIN "4444" y vi "Tu cuenta está bloqueada. Comunícate con soporte."
    Cuando ingreso el celular "70000004" con un PIN incorrecto una vez más
    Entonces veo el mensaje "Celular o PIN incorrectos"
```

## Notas técnicas

- PIN correcto con estado `BLOQUEADO`: `403`, código `CUENTA_BLOQUEADA`, sin JWT.
- PIN incorrecto: `401`, código `CREDENCIALES_INVALIDAS`.
