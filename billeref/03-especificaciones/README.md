# Especificaciones · BilleRef

Fuentes: [`especificaciones-iniciales.md.txt`](especificaciones-iniciales.md.txt), [`01-adr/`](../01-adr/README.md) y [`02-historias/`](../02-historias/README.md).

Una especificación por historia. Cada una tiene cinco secciones:

1. **Reglas** — `R-HH.N`, cada una citando el criterio de aceptación que la verifica (→ `CA-HH.N`).
2. **Contratos** — endpoint, request, response y modelo de datos.
3. **Errores** — código, mensaje al usuario y cuándo ocurre.
4. **Casos borde** — límites exactos, concurrencia, reintentos, formatos raros.
5. **Trazabilidad** — tabla regla → CA, y comprobación de que ningún CA queda sin regla.

> Regla de calidad: si una regla no tiene criterio de aceptación, falta un criterio; si un criterio no tiene regla, falta especificar. Ver [Verificación de trazabilidad](#verificación-de-trazabilidad).

## Índice

| Especificación | Historia | Endpoints principales |
|---|---|---|
| [SPEC-HU-01](SPEC-HU-01-login.md) | Iniciar sesión | `POST /api/auth/login` |
| [SPEC-HU-02](SPEC-HU-02-bloqueo-por-intentos.md) | Bloqueo temporal por intentos | login, transferencias, pagos |
| [SPEC-HU-03](SPEC-HU-03-cuenta-bloqueada.md) | Cuenta bloqueada | `POST /api/auth/login` |
| [SPEC-HU-04](SPEC-HU-04-sesion.md) | Inactividad, recarga y cierre de sesión | `POST /api/auth/renovar`, `POST /api/auth/logout` |
| [SPEC-HU-05](SPEC-HU-05-inicio.md) | Saldo y últimos movimientos | `GET /api/inicio` |
| [SPEC-HU-06](SPEC-HU-06-destinatario.md) | Identificar destinatario | `POST /api/transferencias/destinatario` |
| [SPEC-HU-07](SPEC-HU-07-monto-y-glosa.md) | Monto y glosa | `POST /api/transferencias` (campos) |
| [SPEC-HU-08](SPEC-HU-08-limites.md) | Límites por transferencia y diario | `POST /api/transferencias` |
| [SPEC-HU-09](SPEC-HU-09-confirmar-transferencia.md) | Confirmar transferencia y comprobante | `POST /api/transferencias` |
| [SPEC-HU-10](SPEC-HU-10-idempotencia-transferencia.md) | Evitar doble débito | `POST /api/transferencias` + `Idempotency-Key` |
| [SPEC-HU-11](SPEC-HU-11-consultar-deudas.md) | Consultar deudas | `GET /api/servicios`, `POST /api/servicios/deudas` |
| [SPEC-HU-12](SPEC-HU-12-servicio-no-disponible.md) | Empresa no disponible | `POST /api/servicios/deudas`, `POST /api/test/empresas/comportamiento` |
| [SPEC-HU-13](SPEC-HU-13-pagar-deuda.md) | Pagar deuda con comisión | `POST /api/pagos` |
| [SPEC-HU-14](SPEC-HU-14-idempotencia-pago.md) | Evitar doble pago | `POST /api/pagos` + `Idempotency-Key` |
| [SPEC-HU-15](SPEC-HU-15-historial.md) | Ver historial | `GET /api/historial` |
| [SPEC-HU-16](SPEC-HU-16-filtros-historial.md) | Filtrar historial | `GET /api/historial?tipo=&desde=&hasta=` |
| [SPEC-HU-17](SPEC-HU-17-comprobante.md) | Ver comprobante | `GET /api/operaciones/{numero}/comprobante` |

## Convenciones comunes

- **Base:** `https://localhost:{puerto}/api`, JSON UTF-8, nombres de campos en `camelCase`.
- **Autenticación:** `Authorization: Bearer <jwt>` en todo endpoint salvo `POST /api/auth/login`. Cada respuesta `2xx` autenticada incluye `X-Renewed-Token` (ADR-003).
- **Montos:** cadena con punto decimal, sin separador de miles. En respuestas siempre con 2 decimales (`"5000.00"`); con signo en movimientos (`"-150.50"`, `"+50.00"`) (ADR-005).
- **Fechas:** respuestas en ISO 8601 con desplazamiento de Bolivia (`"2026-10-15T14:30:00-04:00"`); fechas sin hora como `"AAAA-MM-DD"`. Internamente se guarda UTC.
- **Errores:** `ProblemDetails` (RFC 9457) con campos extra; catálogo completo en [`02-historias/README.md`](../02-historias/README.md#catálogo-de-códigos-de-error).

```json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "codigo": "SALDO_INSUFICIENTE",
  "detail": "Saldo insuficiente",
  "traceId": "00-4bf92f...-01",
  "intentosRestantes": null,
  "minutosRestantes": null
}
```

- **Solicitudes malformadas** (JSON inválido, campos obligatorios ausentes, enum desconocido): `400` con código `SOLICITUD_INVALIDA`, salvo que la especificación defina un código más preciso.

## Modelo de datos compartido (en memoria, ADR-002)

| Entidad | Campos |
|---|---|
| `Usuario` | `id: Guid` · `celular: string(8)` · `nombre: string` · `pinHash: string` · `saldo: decimal` · `estado: ACTIVO \| BLOQUEADO` |
| `IntentosAcceso` | `celular: string(8)` · `fallidosConsecutivos: int` · `bloqueadoHasta: DateTimeOffset?` |
| `SesionRevocada` | `sid: Guid` · `expira: DateTimeOffset` |
| `Empresa` | `id: string` (`luz-del-valle`, `aguas-claras`, `netandes`) · `nombre: string` · `servicio: LUZ \| AGUA \| INTERNET` |
| `ClienteServicio` | `empresaId: string` · `codigoCliente: string` (existe aunque no tenga deudas, p. ej. NA-3004) |
| `Deuda` | `empresaId` · `codigoCliente` · `periodo: string "AAAA-MM"` · `monto: decimal` · `vencimiento: DateOnly` · `estado: PENDIENTE \| PAGADA` · `numeroOperacionPago: string?` |
| `Operacion` | `numero: string "OP-AAAAMMDD-NNNNNN"` · `tipo: TRANSFERENCIA \| PAGO_SERVICIO` · `fechaUtc: DateTimeOffset` · `usuarioOrigenId: Guid` · `monto: decimal` · `saldoResultanteOrigen: decimal` · *(transferencia)* `usuarioDestinoId: Guid` · `glosa: string?` · `saldoResultanteDestino: decimal` · *(pago)* `empresaId` · `codigoCliente` · `periodo` · `comision: decimal` |
| `ClaveIdempotencia` | `usuarioId: Guid` · `clave: Guid` · `huella: string (SHA-256 hex)` · `respuesta: objeto serializado` · `creadaUtc: DateTimeOffset` |
| `ComportamientoEmpresa` *(solo Development)* | `empresaId` · `modo: NORMAL \| LENTO \| FALLA` |

Correlativo de operaciones: un contador global en memoria (`NNNNNN`, empieza en `000001`, nunca se reutiliza dentro de una ejecución; se reinicia con `POST /api/test/reset`).

## DTOs compartidos

```jsonc
// MovimientoDto — inicio e historial
{
  "numeroOperacion": "OP-20261015-000001",
  "tipo": "TRANSFERENCIA_ENVIADA",          // | TRANSFERENCIA_RECIBIDA | PAGO_SERVICIO
  "contraparte": "Bruno E*** M***",          // nombre enmascarado o nombre de la empresa
  "fecha": "2026-10-15T14:30:00-04:00",
  "monto": "-150.50"                         // con signo; en pagos = monto + comisión
}

// ComprobanteTransferenciaDto
{
  "numeroOperacion": "OP-20261015-000001",
  "fecha": "2026-10-15T14:30:00-04:00",
  "tipo": "TRANSFERENCIA_ENVIADA",          // | TRANSFERENCIA_RECIBIDA
  "contraparte": { "rol": "DESTINATARIO", "nombreEnmascarado": "Bruno E*** M***" },  // rol: DESTINATARIO | REMITENTE
  "monto": "150.50",
  "glosa": "Almuerzo",                       // o null
  "saldoResultante": "4849.50"               // siempre el del usuario que consulta
}

// ComprobantePagoDto
{
  "numeroOperacion": "OP-20261015-000002",
  "fecha": "2026-10-15T14:35:00-04:00",
  "tipo": "PAGO_SERVICIO",
  "empresa": { "id": "luz-del-valle", "nombre": "Luz del Valle S.A." },
  "codigoCliente": "LV-1001",
  "periodo": "2026-08",
  "monto": "185.40",
  "comision": "1.00",
  "total": "186.40",
  "saldoResultante": "4813.60"
}
```

## Orden de procesamiento de una operación de dinero

Común a `POST /api/transferencias` y `POST /api/pagos` (ADR-002, ADR-004):

1. JWT válido y no revocado → si no, `401 SESION_EXPIRADA`.
2. Cabecera `Idempotency-Key` presente y UUID → si no, `400 IDEMPOTENCIA_CLAVE_REQUERIDA`.
3. Validaciones de formato del cuerpo → `400`.
4. Bloqueo temporal activo → `401 ACCESO_BLOQUEADO_TEMPORAL` (revoca la sesión).
5. Verificación del PIN (fuera del lock) → `422 PIN_INCORRECTO` o, al tercero, `401 ACCESO_BLOQUEADO_TEMPORAL`.
6. **Entrar a la sección crítica.**
7. Idempotencia: clave con éxito previo → misma huella: `200` con la respuesta original; otra huella: `422 IDEMPOTENCIA_CONFLICTO`.
8. Reglas de negocio de la operación (orden en SPEC-HU-09 y SPEC-HU-13) → `422`.
9. Aplicar cambios juntos; ante cualquier excepción se restauran los valores previos → `500 ERROR_INTERNO`.
10. Guardar la clave de idempotencia con la respuesta. **Salir de la sección crítica.** → `201`.

## Verificación de trazabilidad

Comprobado automáticamente al generar estas especificaciones:

- Toda regla `R-HH.N` cita al menos un `CA`.
- Todo `CA-HH.N` de `02-historias/HU-HH-*.md` aparece en al menos una regla de `SPEC-HU-HH`.
- Resultado: **0 reglas sin criterio** y **0 criterios sin regla** (125 reglas, 104 criterios, 17 historias).

Para completar las reglas se agregaron estos criterios a las historias: CA-01.7, CA-03.4, CA-04.6, CA-05.5, CA-06.6, CA-08.7, CA-08.8, CA-10.7, CA-10.8, CA-13.8, CA-13.9, CA-14.5, CA-16.7, CA-17.5. También se precisó CA-02.2 (minutos restantes) y CA-07.2 (formatos inválidos).
