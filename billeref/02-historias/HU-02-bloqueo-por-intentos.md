# HU-02 · Bloqueo temporal por PIN incorrecto

- **Épica:** Acceso · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.1 · ADR-003

## Historia

**Como** usuario de la billetera,
**quiero** que mi acceso se bloquee temporalmente si alguien se equivoca de PIN varias veces seguidas,
**para** que nadie pueda adivinar mi PIN probando combinaciones.

## Reglas de negocio

- 3 PIN incorrectos **seguidos** bloquean el acceso de ese celular durante **5 minutos**.
- El contador es **compartido** entre el login y la confirmación de operaciones (transferencias y pagos).
- Un PIN correcto reinicia el contador.
- Durante el bloqueo no se valida el PIN: cualquier intento responde el mensaje de bloqueo.
- Un celular inexistente también acumula intentos y se bloquea (no se distingue de uno existente).
- Si el tercer error ocurre en una confirmación, la sesión se cierra y el usuario vuelve al login.

## Criterios de aceptación

```gherkin
Característica: Bloqueo temporal por intentos fallidos

  Escenario: CA-02.1 · Tres PIN incorrectos seguidos bloquean el acceso
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "70000002" con el PIN "0000" tres veces seguidas
    Entonces veo el mensaje "Demasiados intentos. Intenta nuevamente en 5 minutos."

  Escenario: CA-02.2 · Durante el bloqueo no se acepta ni el PIN correcto
    Dado que el celular "70000002" fue bloqueado hace 2 minutos
    Cuando ingreso el celular "70000002" y el PIN "2222"
    Entonces veo el mensaje "Demasiados intentos. Intenta nuevamente en 3 minutos."
    Y no ingreso a la billetera

  Escenario: CA-02.3 · El bloqueo termina a los 5 minutos
    Dado que el celular "70000002" fue bloqueado temporalmente
    Y pasaron 5 minutos
    Cuando ingreso el celular "70000002" y el PIN "2222"
    Entonces veo la pantalla de inicio de "Bruno Ejemplo Mamani"

  Escenario: CA-02.4 · Un PIN correcto reinicia el contador
    Dado que ingresé el celular "70000002" con un PIN incorrecto dos veces
    Cuando ingreso el celular "70000002" y el PIN "2222"
    Y luego cierro sesión e ingreso un PIN incorrecto una vez más
    Entonces veo el mensaje "Celular o PIN incorrectos"
    Y el acceso no está bloqueado

  Escenario: CA-02.5 · Los errores de PIN al confirmar cuentan para el bloqueo
    Dado que inicié sesión como "70000001"
    Y estoy confirmando una transferencia de Bs 100,00 a "70000002"
    Cuando ingreso el PIN "0000"
    Entonces veo el mensaje "PIN incorrecto. Te quedan 2 intentos."
    Cuando ingreso el PIN "0000" dos veces más
    Entonces mi sesión se cierra
    Y veo la pantalla de ingreso con el mensaje "Demasiados intentos. Intenta nuevamente en 5 minutos."
    Y no se debitó nada de mi saldo

  Escenario: CA-02.6 · Celular inexistente también se bloquea
    Dado que estoy en la pantalla de ingreso
    Cuando ingreso el celular "79999999" con el PIN "0000" tres veces seguidas
    Entonces veo el mensaje "Demasiados intentos. Intenta nuevamente en 5 minutos."
```

## Notas técnicas

- Contador en memoria por celular; el bloqueo usa `TimeProvider` para poder probarse sin esperar (ADR-008).
- Login bloqueado: `423` con código `ACCESO_BLOQUEADO_TEMPORAL`. Confirmación: `422` `PIN_INCORRECTO` en los errores 1 y 2; `401` `ACCESO_BLOQUEADO_TEMPORAL` en el tercero, con revocación del `sid`.
- "X minutos" se redondea hacia arriba al minuto entero.
