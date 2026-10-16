# HU-10 · Evitar el doble débito ante un doble envío

- **Épica:** Transferencias · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.3, §7 · ADR-004

## Historia

**Como** usuario que confirma una transferencia,
**quiero** que si toco dos veces "Confirmar" o la red reintenta, el dinero se envíe una sola vez,
**para** no perder dinero por un error técnico o un doble toque.

## Reglas de negocio

- Cada entrada a la pantalla de confirmación genera una clave única de idempotencia.
- La misma solicitud reenviada con la misma clave **no genera un segundo débito** y devuelve el **mismo comprobante**.
- Si el usuario vuelve atrás y cambia algún dato, la siguiente confirmación es una operación nueva.
- Solo las operaciones exitosas consumen la clave: tras un error se puede reintentar con la misma clave.
- Dos transferencias legítimas iguales, hechas en confirmaciones distintas, se procesan las dos.

## Criterios de aceptación

```gherkin
Característica: Evitar el doble débito

  Antecedentes:
    Dado que inicié sesión como "70000001"
    Y estoy en la confirmación de una transferencia de Bs 100,00 a "70000002"

  Escenario: CA-10.1 · Doble toque en "Confirmar"
    Cuando toco "Confirmar" dos veces seguidas con mi PIN "1111"
    Entonces se debita una sola vez
    Y mi saldo es "Bs 4.900,00"
    Y el historial muestra una sola transferencia

  Escenario: CA-10.2 · Reintento tras perder la respuesta
    Dado que confirmé con mi PIN "1111" y la respuesta se perdió por la red
    Cuando la aplicación reenvía la misma solicitud con la misma clave
    Entonces recibo el mismo número de operación
    Y mi saldo es "Bs 4.900,00"

  Escenario: CA-10.3 · Misma clave con datos distintos
    Dado que confirmé con mi PIN "1111" con una clave
    Cuando se envía otra solicitud con la misma clave y el monto "200"
    Entonces la respuesta tiene el código "IDEMPOTENCIA_CONFLICTO"
    Y no se debita nada más

  Escenario: CA-10.4 · Dos transferencias iguales en confirmaciones distintas
    Dado que confirmé la transferencia con mi PIN "1111"
    Cuando inicio una nueva transferencia de Bs 100,00 a "70000002" y la confirmo
    Entonces se realizan las dos transferencias
    Y mi saldo es "Bs 4.800,00"

  Escenario: CA-10.5 · Reintento tras un PIN incorrecto
    Dado que confirmé con el PIN "0000" y recibí "PIN incorrecto"
    Cuando confirmo con mi PIN "1111"
    Entonces la transferencia se realiza una sola vez

  Escenario: CA-10.6 · Botón deshabilitado mientras se procesa
    Cuando toco "Confirmar"
    Entonces el botón queda deshabilitado hasta recibir la respuesta

  Escenario: CA-10.7 · Solicitud sin clave de idempotencia
    Cuando envío a la API la transferencia sin la cabecera "Idempotency-Key"
    Entonces la respuesta es "400" con el código "IDEMPOTENCIA_CLAVE_REQUERIDA"
    Y no se debita nada

  Escenario: CA-10.8 · La clave vence a las 24 horas
    Dado que confirmé con mi PIN "1111" usando una clave hace más de 24 horas
    Cuando se reenvía la misma solicitud con esa clave
    Entonces se procesa como una transferencia nueva
```

## Notas técnicas

- Cabecera `Idempotency-Key` (UUID v4) obligatoria; sin ella o con formato inválido → `400`.
- Huella SHA-256 de `{celularDestino, monto, glosa}`, **sin el PIN**.
- Búsqueda y registro de la clave dentro de la sección crítica; claves válidas 24 h.
- El doble envío se prueba en integración con dos `POST` concurrentes con la misma clave.
