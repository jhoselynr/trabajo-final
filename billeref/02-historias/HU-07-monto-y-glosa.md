# HU-07 · Ingresar monto y glosa válidos

- **Épica:** Transferencias · **Prioridad:** Alta
- **Trazabilidad:** Especificación §3.3 · ADR-005 · Supuesto S-06

## Historia

**Como** usuario que quiere transferir dinero,
**quiero** ingresar el monto y, si quiero, una glosa, y que el sistema me avise si algo no es válido,
**para** no enviar montos equivocados ni quedarme sin saldo.

## Reglas de negocio

- El monto debe ser **mayor a Bs 0** y tener **como máximo 2 decimales**; nunca se redondea.
- Se acepta coma o punto como separador decimal (`150,50` o `150.50`), sin separador de miles.
- El monto no puede ser mayor al **saldo disponible**.
- La glosa es **opcional**, de **máximo 60 caracteres**, contados tras quitar los espacios del inicio y del final.
- Los límites por transferencia y diario están en HU-08.

## Criterios de aceptación

```gherkin
Característica: Monto y glosa de la transferencia

  Antecedentes:
    Dado que inicié sesión como "70000002" con saldo "Bs 800,00"
    Y elegí como destinatario a "70000001"

  Esquema del escenario: CA-07.1 · Montos válidos
    Cuando ingreso el monto "<monto>"
    Entonces puedo continuar a la confirmación con el monto "<mostrado>"

    Ejemplos:
      | monto  | mostrado    |
      | 0,01   | Bs 0,01     |
      | 150,50 | Bs 150,50   |
      | 150.5  | Bs 150,50   |
      | 800    | Bs 800,00   |

  Esquema del escenario: CA-07.2 · Montos inválidos
    Cuando ingreso el monto "<monto>"
    Entonces veo el mensaje "<mensaje>"
    Y no puedo continuar

    Ejemplos:
      | monto   | mensaje                                   |
      | 0       | El monto debe ser mayor a Bs 0            |
      | -5      | El monto debe ser mayor a Bs 0            |
      | 10,001  | El monto admite como máximo 2 decimales   |
      | abc     | Ingresa un monto válido                   |
      | 1.000,50 | Ingresa un monto válido                  |
      | 1.500   | El monto admite como máximo 2 decimales   |

  Escenario: CA-07.3 · Monto mayor al saldo
    Cuando ingreso el monto "800,01"
    Y confirmo con mi PIN "2222"
    Entonces veo el mensaje "Saldo insuficiente"
    Y mi saldo sigue siendo "Bs 800,00"

  Escenario: CA-07.4 · Usuario sin saldo
    Dado que inicié sesión como "70000003" con saldo "Bs 0,00"
    Y elegí como destinatario a "70000001"
    Cuando ingreso el monto "1" y confirmo con mi PIN "3333"
    Entonces veo el mensaje "Saldo insuficiente"

  Escenario: CA-07.5 · Glosa opcional
    Cuando ingreso el monto "50" sin glosa
    Entonces puedo continuar a la confirmación

  Escenario: CA-07.6 · Glosa de 60 caracteres
    Cuando ingreso el monto "50" y una glosa de 60 caracteres
    Entonces puedo continuar a la confirmación

  Escenario: CA-07.7 · Glosa de más de 60 caracteres
    Cuando envío a la API una transferencia con una glosa de 61 caracteres
    Entonces la respuesta tiene el código "GLOSA_LARGA"
    Y en la interfaz el campo de glosa no permite escribir más de 60 caracteres

  Escenario: CA-07.8 · Espacios al inicio y al final no cuentan
    Cuando ingreso una glosa de 60 caracteres rodeada de espacios
    Entonces puedo continuar a la confirmación
    Y la glosa se guarda sin esos espacios
```

## Notas técnicas

- Formato válido tras normalizar: `^\d{1,7}([.]\d{1,2})?$` (ADR-005); monto como cadena en el JSON.
- El saldo insuficiente se valida en el backend dentro de la sección crítica (ADR-002), por eso aparece al confirmar.
- Códigos: `MONTO_INVALIDO`, `MONTO_NO_POSITIVO`, `MONTO_DECIMALES`, `GLOSA_LARGA`, `SALDO_INSUFICIENTE`.
