# SPEC-HU-02 · Bloqueo temporal por PIN incorrecto

- **Historia:** [HU-02](../02-historias/HU-02-bloqueo-por-intentos.md) · **ADR:** 003

## 1. Reglas

- **R-02.1** Al tercer PIN incorrecto consecutivo de un celular, se fija `bloqueadoHasta = ahora + 5 min` y esa misma respuesta ya es `423 ACCESO_BLOQUEADO_TEMPORAL` con 5 minutos. → CA-02.1
- **R-02.2** Mientras `ahora < bloqueadoHasta`, todo login de ese celular responde `423` **sin verificar el PIN**. Los minutos restantes se redondean hacia arriba: `ceil((bloqueadoHasta − ahora) / 1 min)`. → CA-02.2
- **R-02.3** Cuando `ahora >= bloqueadoHasta`, el bloqueo termina y el contador vuelve a 0; el siguiente login se evalúa normalmente. → CA-02.3
- **R-02.4** Un PIN correcto (en login o confirmación) reinicia `fallidosConsecutivos` a 0. → CA-02.4
- **R-02.5** El contador es **compartido** entre login y confirmación de operaciones. En una confirmación, los fallos 1 y 2 responden `422 PIN_INCORRECTO` con `intentosRestantes`; el tercero responde `401 ACCESO_BLOQUEADO_TEMPORAL`, revoca el `sid` de la sesión y no ejecuta la operación. → CA-02.5
- **R-02.6** Un celular inexistente también acumula intentos y se bloquea igual que uno existente. → CA-02.6
- **R-02.7** Un PIN con formato inválido (`PIN_INVALIDO`) no suma intento. → CA-01.7
- **R-02.8** "Consecutivos" no depende del tiempo: el contador solo vuelve a 0 por un PIN correcto o al terminar un bloqueo. → CA-02.4

## 2. Contratos

No tiene endpoint propio. Afecta a:

- `POST /api/auth/login` (SPEC-HU-01)
- `POST /api/transferencias` (SPEC-HU-09) y `POST /api/pagos` (SPEC-HU-13), paso 4–5 del orden común.

Respuesta de bloqueo (login):
```json
{ "status": 423, "codigo": "ACCESO_BLOQUEADO_TEMPORAL",
  "detail": "Demasiados intentos. Intenta nuevamente en 3 minutos.", "minutosRestantes": 3 }
```

Respuesta de PIN incorrecto en confirmación:
```json
{ "status": 422, "codigo": "PIN_INCORRECTO",
  "detail": "PIN incorrecto. Te quedan 2 intentos.", "intentosRestantes": 2 }
```

### Modelo de datos

- `IntentosAcceso { celular, fallidosConsecutivos, bloqueadoHasta }`, en un diccionario concurrente por celular; la actualización de un celular es atómica (lock por clave).
- Reloj: `TimeProvider` inyectado.

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `ACCESO_BLOQUEADO_TEMPORAL` | 423 | Demasiados intentos. Intenta nuevamente en X minutos. | Login: tercer fallo o bloqueo vigente |
| `ACCESO_BLOQUEADO_TEMPORAL` | 401 | Demasiados intentos. Intenta nuevamente en X minutos. | Confirmación: tercer fallo o bloqueo vigente; además cierra la sesión |
| `PIN_INCORRECTO` | 422 | PIN incorrecto. Te quedan N intentos. | Confirmación: fallos 1 y 2 |
| `CREDENCIALES_INVALIDAS` | 401 | Celular o PIN incorrectos | Login: fallos 1 y 2 |

## 4. Casos borde

| Caso | Resultado esperado |
|---|---|
| Bloqueado hace 4 min 59 s | `423` con `minutosRestantes: 1` y el texto en singular: "Intenta nuevamente en 1 minuto." |
| Bloqueado hace exactamente 5 min | Bloqueo terminado; se evalúa el PIN |
| 2 fallos en login + 1 fallo en confirmación | Bloqueo (contador compartido) y cierre de sesión |
| 2 fallos, luego 1 hora sin intentos, luego 1 fallo | Bloqueo (no hay vencimiento por tiempo, R-02.8) |
| Tres solicitudes incorrectas simultáneas | El contador se incrementa de forma atómica; exactamente una llega a 3 |
| Confirmación durante un bloqueo vigente (iniciado desde otro dispositivo) | `401 ACCESO_BLOQUEADO_TEMPORAL` sin verificar el PIN y la sesión se revoca |
| Consultas sin PIN (saldo, historial) durante un bloqueo | Siguen funcionando hasta que la sesión expire o se revoque |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-02.1 | CA-02.1 |
| R-02.2 | CA-02.2 |
| R-02.3 | CA-02.3 |
| R-02.4 | CA-02.4 |
| R-02.5 | CA-02.5 |
| R-02.6 | CA-02.6 |
| R-02.7 | CA-01.7 |
| R-02.8 | CA-02.4 |

Criterios de HU-02 sin regla: **ninguno** (CA-02.1 a CA-02.6 cubiertos).
