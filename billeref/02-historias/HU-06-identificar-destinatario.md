# HU-06 · Identificar al destinatario por su celular

- **Épica:** Transferencias · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.3 · ADR-001, ADR-003 · Supuestos S-02, S-03

## Historia

**Como** usuario que quiere transferir dinero,
**quiero** ingresar el celular del destinatario y ver su nombre parcialmente oculto,
**para** confirmar que le envío el dinero a la persona correcta sin exponer sus datos.

## Reglas de negocio

- El destinatario se identifica por su celular de 8 dígitos y debe ser **otro usuario activo** de la billetera.
- El nombre se muestra enmascarado: primer nombre completo y, de los demás, la inicial seguida de `***` (S-02).
- Un celular inexistente o de una cuenta bloqueada responde el mismo mensaje (S-03).
- No se puede transferir al propio celular.

## Criterios de aceptación

```gherkin
Característica: Identificar al destinatario

  Antecedentes:
    Dado que inicié sesión como "70000001"
    Y estoy en la pantalla de transferencia

  Escenario: CA-06.1 · Destinatario activo
    Cuando ingreso el celular de destino "70000002"
    Entonces veo el destinatario "Bruno E*** M***"

  Escenario: CA-06.2 · Destinatario con cuenta bloqueada
    Cuando ingreso el celular de destino "70000004"
    Entonces veo el mensaje "El destinatario no está disponible"
    Y no puedo continuar

  Escenario: CA-06.3 · Destinatario inexistente
    Cuando ingreso el celular de destino "79999999"
    Entonces veo el mensaje "El destinatario no está disponible"
    Y no puedo continuar

  Escenario: CA-06.4 · Transferencia a uno mismo
    Cuando ingreso el celular de destino "70000001"
    Entonces veo el mensaje "No puedes transferirte a ti mismo"
    Y no puedo continuar

  Escenario: CA-06.5 · Celular con formato inválido
    Cuando ingreso el celular de destino "70A00002"
    Entonces veo el mensaje "Ingresa un celular válido de 8 dígitos"

  Escenario: CA-06.6 · El destinatario se bloquea antes de confirmar
    Dado que identifiqué al destinatario "70000002"
    Y su cuenta pasa a estado bloqueado antes de que confirme
    Cuando confirmo una transferencia de Bs 100,00 con mi PIN "1111"
    Entonces veo el mensaje "El destinatario no está disponible"
    Y no se debita nada de mi saldo
```

## Notas técnicas

- `POST /api/transferencias/destinatario` con cuerpo `{celular}`; responde `{nombreEnmascarado}`. El celular nunca va en la URL (ADR-001, ADR-007).
- Códigos: `DESTINATARIO_NO_DISPONIBLE`, `TRANSFERENCIA_A_SI_MISMO`, `CELULAR_INVALIDO`.
- Estas validaciones se repiten en `POST /api/transferencias` (el destinatario podría bloquearse entre ambos pasos).
