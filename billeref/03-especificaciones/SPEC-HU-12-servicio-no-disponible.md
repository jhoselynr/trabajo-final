# SPEC-HU-12 · Informar cuando la empresa no responde

- **Historia:** [HU-12](../02-historias/HU-12-servicio-no-disponible.md) · **ADR:** 006, 008

## 1. Reglas

- **R-12.1** Cada intento de `ConsultarDeudasAsync` tiene un timeout de `Servicios:TimeoutSegundos` (10 s por defecto). → CA-12.1
- **R-12.2** Si un intento vence o lanza una excepción, se reintenta automáticamente `Servicios:Reintentos` veces (1 por defecto), sin espera entre intentos. El usuario no ve el reintento. → CA-12.4
- **R-12.3** Si todos los intentos fallan, se responde `503 SERVICIO_NO_DISPONIBLE` con el nombre de la empresa. → CA-12.1, CA-12.2
- **R-12.4** La consulta es de solo lectura: un fallo nunca modifica saldos, deudas ni operaciones. → CA-12.1
- **R-12.5** Ante `503`, la interfaz muestra el mensaje y un botón "Reintentar" que repite la misma consulta. → CA-12.1, CA-12.3
- **R-12.6** Solo se reintentan timeouts y excepciones del gateway. Las respuestas de negocio (`CODIGO_CLIENTE_INEXISTENTE`, lista vacía) no se reintentan. → CA-12.4
- **R-12.7** En `Development`, el modo de cada empresa (`NORMAL`, `LENTO`, `FALLA`) se cambia con `POST /api/test/empresas/comportamiento`. `LENTO` demora `TimeoutSegundos + 5 s` respetando el `CancellationToken`; `FALLA` lanza una excepción. → CA-12.1, CA-12.2, CA-12.3
- **R-12.8** El timeout HTTP del frontend para esta consulta es de 30 s, mayor que el peor caso del backend (~20 s), para que el error lo decida el backend. → CA-12.1

## 2. Contratos

### `POST /api/servicios/deudas`
Igual que en SPEC-HU-11. Respuesta de falla:

```json
{ "status": 503, "codigo": "SERVICIO_NO_DISPONIBLE",
  "detail": "El servicio de Luz del Valle S.A. no está disponible. Intenta más tarde." }
```

### `POST /api/test/empresas/comportamiento` (solo `Development`)

Request:
```json
{ "empresaId": "luz-del-valle", "modo": "LENTO" }
```

Response `204`. Fuera de `Development` el endpoint no existe (`404`). `POST /api/test/reset` vuelve todas las empresas a `NORMAL`.

### Configuración (`appsettings.json`)
```json
{ "Servicios": { "TimeoutSegundos": 10, "Reintentos": 1 } }
```

### Modelo de datos
- `ComportamientoEmpresa { empresaId, modo }` (solo `Development`).
- `ResiliencePipeline` de Polly v8: estrategia de *retry* externa y *timeout* interna (el timeout aplica a cada intento).

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `SERVICIO_NO_DISPONIBLE` | 503 | El servicio de {empresa} no está disponible. Intenta más tarde. | Todos los intentos vencieron o fallaron |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| Primer intento a los 9,9 s responde bien | Éxito sin reintento |
| Primer intento vence (10 s), segundo responde en 1 s | Éxito a los ~11 s (CA-12.4) |
| Ambos vencen | `503` a los ~20 s |
| Modo `FALLA` | `503` casi inmediato (dos excepciones) |
| El usuario sale de la pantalla durante la consulta | El frontend cancela la petición; el backend aborta con el `CancellationToken` de la solicitud |
| Pago (`POST /api/pagos`) con la empresa en modo `LENTO` | El pago **no** usa el gateway (SPEC-HU-13): se procesa normalmente |
| Pruebas E2E | Backend con `Servicios:TimeoutSegundos = 2` |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-12.1 | CA-12.1 |
| R-12.2 | CA-12.4 |
| R-12.3 | CA-12.1, CA-12.2 |
| R-12.4 | CA-12.1 |
| R-12.5 | CA-12.1, CA-12.3 |
| R-12.6 | CA-12.4 |
| R-12.7 | CA-12.1, CA-12.2, CA-12.3 |
| R-12.8 | CA-12.1 |

Criterios de HU-12 sin regla: **ninguno** (CA-12.1 a CA-12.4 cubiertos).
