# SPEC-HU-06 · Identificar al destinatario por su celular

- **Historia:** [HU-06](../02-historias/HU-06-identificar-destinatario.md) · **ADR:** 001, 003, 007

## 1. Reglas

- **R-06.1** El celular de destino debe cumplir `^\d{8}$`; si no, `400 CELULAR_INVALIDO`. → CA-06.5
- **R-06.2** Si el celular pertenece a otro usuario `ACTIVO`, se devuelve su nombre enmascarado. → CA-06.1
- **R-06.3** Enmascaramiento: se separa el nombre por espacios; la primera palabra va completa; cada palabra siguiente se reemplaza por su primera letra seguida de `***`, separadas por un espacio ("Bruno Ejemplo Mamani" → "Bruno E\*\*\* M\*\*\*"). → CA-06.1
- **R-06.4** Si el celular es el del propio usuario, `422 TRANSFERENCIA_A_SI_MISMO`. Se evalúa antes que la existencia. → CA-06.4
- **R-06.5** Si el celular no existe o pertenece a un usuario `BLOQUEADO`, `422 DESTINATARIO_NO_DISPONIBLE` con el mismo mensaje en ambos casos. → CA-06.2, CA-06.3
- **R-06.6** Las reglas R-06.1, R-06.4 y R-06.5 se vuelven a evaluar en `POST /api/transferencias`, dentro de la sección crítica. → CA-06.6

## 2. Contratos

### `POST /api/transferencias/destinatario`

Request:
```json
{ "celular": "70000002" }
```

Response `200`:
```json
{ "celular": "70000002", "nombreEnmascarado": "Bruno E*** M***" }
```

El celular va en el cuerpo y nunca en la URL (ADR-001, ADR-007).

### Modelo de datos
- `Usuario.celular`, `Usuario.nombre`, `Usuario.estado`.
- Función de dominio `Mascaras.Nombre(string nombre): string` (ADR-007), reutilizada en movimientos, comprobantes y logs.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `CELULAR_INVALIDO` | 400 | Ingresa un celular válido de 8 dígitos | Formato distinto de 8 dígitos |
| `TRANSFERENCIA_A_SI_MISMO` | 422 | No puedes transferirte a ti mismo | Celular igual al del usuario autenticado |
| `DESTINATARIO_NO_DISPONIBLE` | 422 | El destinatario no está disponible | Celular inexistente o usuario `BLOQUEADO` |

## 4. Casos borde

| Caso | Resultado esperado |
|---|---|
| Nombre de una sola palabra | Se muestra la palabra completa sin máscara |
| Espacios dobles en el nombre | Se ignoran las palabras vacías |
| Palabra que empieza con tilde, "Ángel" | "Á\*\*\*" (primer carácter tal cual) |
| Destinatario bloqueado entre identificar y confirmar | `422 DESTINATARIO_NO_DISPONIBLE` al confirmar, sin débito (R-06.6) |
| Consultas masivas de celulares para descubrir usuarios | Riesgo aceptado en el alcance académico: no hay límite de frecuencia; anotado para un ADR futuro |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-06.1 | CA-06.5 |
| R-06.2 | CA-06.1 |
| R-06.3 | CA-06.1 |
| R-06.4 | CA-06.4 |
| R-06.5 | CA-06.2, CA-06.3 |
| R-06.6 | CA-06.6 |

Criterios de HU-06 sin regla: **ninguno** (CA-06.1 a CA-06.6 cubiertos).
