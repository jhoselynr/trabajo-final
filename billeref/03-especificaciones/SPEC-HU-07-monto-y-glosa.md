# SPEC-HU-07 · Ingresar monto y glosa válidos

- **Historia:** [HU-07](../02-historias/HU-07-monto-y-glosa.md) · **ADR:** 005

## 1. Reglas

- **R-07.1** Normalización del monto (frontend): quitar espacios al inicio y final; si contiene `.` **y** `,` a la vez, es inválido; si contiene `,`, se reemplaza por `.`. → CA-07.1, CA-07.2
- **R-07.2** Tras normalizar, el monto debe cumplir `^-?\d+([.]\d+)?$`; si no, `400 MONTO_INVALIDO`. → CA-07.2
- **R-07.3** Si el valor es ≤ 0, `400 MONTO_NO_POSITIVO`. → CA-07.2
- **R-07.4** Si tiene más de 2 decimales, `400 MONTO_DECIMALES`. **Nunca** se redondea. → CA-07.2
- **R-07.5** Se aceptan coma o punto como separador decimal, y 0, 1 o 2 decimales; la confirmación muestra siempre 2 decimales. → CA-07.1
- **R-07.6** El saldo debe ser ≥ monto; se valida en el backend dentro de la sección crítica y, si no alcanza, `422 SALDO_INSUFICIENTE` sin cambios. → CA-07.3, CA-07.4
- **R-07.7** La glosa es opcional: `null`, `""` o solo espacios se guardan como `null`. → CA-07.5
- **R-07.8** La glosa se recorta (espacios al inicio y final) y luego debe tener ≤ 60 caracteres (longitud UTF-16, igual en C# `.Length` y JS `.length`); si no, `400 GLOSA_LARGA`. → CA-07.6, CA-07.7, CA-07.8
- **R-07.9** El campo glosa del frontend tiene `maxlength="60"`. → CA-07.7

**Orden de validación del monto:** R-07.1 → R-07.2 → R-07.3 → R-07.4 → límite por transferencia (SPEC-HU-08) → (backend, en el lock) saldo.

## 2. Contratos

Monto y glosa son campos de `POST /api/transferencias` (contrato completo en SPEC-HU-09):

```json
{ "celularDestino": "70000001", "monto": "150.50", "glosa": "Almuerzo", "pin": "2222" }
```

- `monto`: **cadena**, ya normalizada con punto. El backend la convierte con `decimal.Parse(valor, NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture)` y aplica R-07.2 a R-07.4 de nuevo.
- `glosa`: cadena o `null`.

### Modelo de datos
- `Operacion.monto: decimal`, `Operacion.glosa: string?` (ya recortada).
- Validador compartido en `BilleRef.Domain` (`ValidadorMonto`, `ValidadorGlosa`) y su equivalente en Angular.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `MONTO_INVALIDO` | 400 | Ingresa un monto válido | Texto no numérico, separador de miles, `.` y `,` juntos |
| `MONTO_NO_POSITIVO` | 400 | El monto debe ser mayor a Bs 0 | Valor ≤ 0 |
| `MONTO_DECIMALES` | 400 | El monto admite como máximo 2 decimales | Más de 2 decimales |
| `GLOSA_LARGA` | 400 | La glosa admite como máximo 60 caracteres | Más de 60 caracteres tras recortar |
| `SALDO_INSUFICIENTE` | 422 | Saldo insuficiente | Monto mayor al saldo al momento de confirmar |

## 4. Casos borde

| Entrada | Resultado |
|---|---|
| `"0"`, `"0.00"`, `"-5"`, `"-0.5"` | `MONTO_NO_POSITIVO` |
| `"0.001"` | `MONTO_DECIMALES` (es > 0) |
| `"0.01"` | Válido (mínimo posible) |
| `"150.5"` / `"150,5"` | Válido → `150.50` |
| `"1.500"` | `MONTO_DECIMALES` (no se interpreta como mil quinientos) |
| `"1.000,50"`, `"1,000.50"` | `MONTO_INVALIDO` |
| `"abc"`, `""`, `"1e3"`, `"  "` | `MONTO_INVALIDO` |
| `"800"` con saldo Bs 800,00 | Válido: el saldo queda en Bs 0,00 |
| `"800.01"` con saldo Bs 800,00 | `SALDO_INSUFICIENTE` |
| Glosa de 60 caracteres | Válida |
| Glosa de 61 caracteres vía API | `GLOSA_LARGA` |
| Glosa `"  Almuerzo  "` | Se guarda `"Almuerzo"` |
| Glosa con salto de línea vía API | El backend reemplaza `\r` y `\n` por un espacio antes de recortar y medir |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-07.1 | CA-07.1, CA-07.2 |
| R-07.2 | CA-07.2 |
| R-07.3 | CA-07.2 |
| R-07.4 | CA-07.2 |
| R-07.5 | CA-07.1 |
| R-07.6 | CA-07.3, CA-07.4 |
| R-07.7 | CA-07.5 |
| R-07.8 | CA-07.6, CA-07.7, CA-07.8 |
| R-07.9 | CA-07.7 |

Criterios de HU-07 sin regla: **ninguno** (CA-07.1 a CA-07.8 cubiertos).
