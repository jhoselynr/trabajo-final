# SPEC-HU-11 · Consultar las deudas de un código de cliente

- **Historia:** [HU-11](../02-historias/HU-11-consultar-deudas.md) · **ADR:** 006, 005

## 1. Reglas

- **R-11.1** `GET /api/servicios` devuelve los tres tipos de servicio con sus empresas; al elegir un tipo, la interfaz muestra solo sus empresas. → CA-11.1
- **R-11.2** El código de cliente se normaliza (recortar espacios y pasar a mayúsculas) y debe existir como `ClienteServicio` de la empresa elegida; si no, `422 CODIGO_CLIENTE_INEXISTENTE` con el nombre de la empresa. → CA-11.5, CA-11.6
- **R-11.3** Se devuelven solo las deudas `PENDIENTE`, ordenadas por `vencimiento` ascendente y, si empatan, por `periodo` ascendente. → CA-11.2, CA-11.3
- **R-11.4** Solo la primera deuda de la lista tiene `pagable = true`; las demás tienen `pagable = false` y `motivoNoPagable = "Paga primero el periodo {periodo de la primera}"`. → CA-11.2, CA-11.3
- **R-11.5** `vencida = vencimiento < fecha actual de Bolivia`. Una deuda que vence hoy no está vencida. → CA-11.2
- **R-11.6** Un código existente sin deudas pendientes devuelve `deudas: []`, y la interfaz muestra "No tienes deudas pendientes con {empresa}". → CA-11.4
- **R-11.7** Mientras la consulta está en curso, la interfaz muestra "Consultando deudas…" y deshabilita el botón de consulta. → CA-11.7
- **R-11.8** Cada deuda incluye `comision` y `total` calculados por el backend, para que el frontend no calcule dinero (ADR-005). → CA-11.2

## 2. Contratos

### `GET /api/servicios`

Response `200`:
```json
[
  { "servicio": "LUZ", "nombre": "Luz",
    "empresas": [ { "id": "luz-del-valle", "nombre": "Luz del Valle S.A." } ] },
  { "servicio": "AGUA", "nombre": "Agua",
    "empresas": [ { "id": "aguas-claras", "nombre": "Aguas Claras" } ] },
  { "servicio": "INTERNET", "nombre": "Internet",
    "empresas": [ { "id": "netandes", "nombre": "NetAndes" } ] }
]
```

### `POST /api/servicios/deudas`

Request:
```json
{ "empresaId": "luz-del-valle", "codigoCliente": "LV-1001" }
```

Response `200` (consultado el 15/10/2026):
```json
{
  "empresa": { "id": "luz-del-valle", "nombre": "Luz del Valle S.A." },
  "codigoCliente": "LV-1001",
  "deudas": [
    { "periodo": "2026-08", "monto": "185.40", "comision": "1.00", "total": "186.40",
      "vencimiento": "2026-09-15", "vencida": true, "pagable": true, "motivoNoPagable": null },
    { "periodo": "2026-09", "monto": "172.10", "comision": "1.00", "total": "173.10",
      "vencimiento": "2026-10-15", "vencida": false, "pagable": false,
      "motivoNoPagable": "Paga primero el periodo 2026-08" }
  ]
}
```

### Modelo de datos
- `Empresa`, `ClienteServicio`, `Deuda` (README).
- La consulta pasa por `IEmpresaServiciosGateway.ConsultarDeudasAsync` con timeout y reintento (SPEC-HU-12).

## 3. Errores

| Código | HTTP | Mensaje al usuario | Cuándo ocurre |
|---|---|---|---|
| `CODIGO_CLIENTE_INEXISTENTE` | 422 | El código de cliente no existe en {empresa} | El código no existe en la empresa elegida |
| `SOLICITUD_INVALIDA` | 400 | No se pudo procesar la solicitud | `empresaId` desconocido o campos vacíos |
| `SERVICIO_NO_DISPONIBLE` | 503 | El servicio de {empresa} no está disponible. Intenta más tarde. | Ver SPEC-HU-12 |

## 4. Casos borde

| Caso | Resultado |
|---|---|
| `"lv-1001"` o `" LV-1001 "` | Se normaliza a `LV-1001` y se encuentra |
| `AC-2002` consultado en Luz del Valle | `CODIGO_CLIENTE_INEXISTENTE` (existe, pero en otra empresa) |
| `NA-3004` | `200` con `deudas: []` |
| Deuda que vence hoy (`2026-10-15`) | `vencida: false` |
| Tras pagar 2026-08 de LV-1001 | Solo aparece 2026-09, con `pagable: true` |
| `empresaId` de agua elegido con el tipo "Luz" en la interfaz | No puede ocurrir en la interfaz; vía API se valida solo contra la empresa enviada |

## 5. Trazabilidad

| Regla | Criterios |
|---|---|
| R-11.1 | CA-11.1 |
| R-11.2 | CA-11.5, CA-11.6 |
| R-11.3 | CA-11.2, CA-11.3 |
| R-11.4 | CA-11.2, CA-11.3 |
| R-11.5 | CA-11.2 |
| R-11.6 | CA-11.4 |
| R-11.7 | CA-11.7 |
| R-11.8 | CA-11.2 |

Criterios de HU-11 sin regla: **ninguno** (CA-11.1 a CA-11.7 cubiertos).
