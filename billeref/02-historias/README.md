# Historias de usuario · BilleRef

Fuentes: [`03-especificaciones/especificaciones-iniciales.md.txt`](../03-especificaciones/especificaciones-iniciales.md.txt) y [`01-adr/`](../01-adr/README.md).
Formato: una historia por archivo — *Como / Quiero / Para*, reglas de negocio, criterios de aceptación en Gherkin (Dado / Cuando / Entonces) con los datos semilla, y notas técnicas con su trazabilidad.
Cada criterio de aceptación tiene un identificador `CA-HH.N` (historia HH, criterio N) que citan las especificaciones de [`03-especificaciones/`](../03-especificaciones/README.md).

## Índice

| ID | Épica | Historia | Prioridad | Especificación | ADR |
|---|---|---|---|---|---|
| [HU-01](HU-01-iniciar-sesion.md) | Acceso | Iniciar sesión con celular y PIN | Alta | §3.1 | 003, 007 |
| [HU-02](HU-02-bloqueo-por-intentos.md) | Acceso | Bloqueo temporal por PIN incorrecto | Alta | §3.1 | 003 |
| [HU-03](HU-03-cuenta-bloqueada.md) | Acceso | Ingreso de un usuario con cuenta bloqueada | Alta | §4, §7 | 003 |
| [HU-04](HU-04-sesion-inactividad-y-cierre.md) | Acceso | Cierre de sesión por inactividad, recarga o voluntad del usuario | Alta | §3.1 | 003 |
| [HU-05](HU-05-inicio-saldo-y-movimientos.md) | Inicio | Ver saldo y últimos 5 movimientos | Alta | §3.2 | 005 |
| [HU-06](HU-06-identificar-destinatario.md) | Transferencias | Identificar al destinatario por su celular | Alta | §3.3 | 001, 003 |
| [HU-07](HU-07-monto-y-glosa.md) | Transferencias | Ingresar monto y glosa válidos | Alta | §3.3 | 005 |
| [HU-08](HU-08-limites-de-transferencia.md) | Transferencias | Respetar los límites por transferencia y diario | Alta | §3.3, §7 | 005, 002 |
| [HU-09](HU-09-confirmar-transferencia.md) | Transferencias | Confirmar la transferencia con PIN y obtener el comprobante | Alta | §3.3 | 002, 003 |
| [HU-10](HU-10-evitar-doble-transferencia.md) | Transferencias | Evitar el doble débito ante un doble envío | Alta | §3.3, §7 | 004 |
| [HU-11](HU-11-consultar-deudas.md) | Pago de servicios | Consultar las deudas de un código de cliente | Alta | §3.4 | 006 |
| [HU-12](HU-12-servicio-no-disponible.md) | Pago de servicios | Informar cuando la empresa no responde | Alta | §7 | 006 |
| [HU-13](HU-13-pagar-deuda.md) | Pago de servicios | Pagar la deuda más antigua con comisión | Alta | §3.4 | 002, 005, 006 |
| [HU-14](HU-14-evitar-doble-pago.md) | Pago de servicios | Evitar el doble pago de una deuda | Alta | §3.4, §7 | 004, 006 |
| [HU-15](HU-15-ver-historial.md) | Historial | Ver el historial de operaciones | Alta | §3.5 | 002, 005 |
| [HU-16](HU-16-filtrar-historial.md) | Historial | Filtrar el historial por tipo y fechas | Alta | §3.5 | 005 |
| [HU-17](HU-17-ver-comprobante.md) | Historial | Ver el comprobante de una operación | Alta | §3.3, §3.4, §3.5 | 001, 002 |

## Datos semilla usados en los escenarios

| Celular | Nombre | Nombre enmascarado | PIN | Saldo inicial | Estado |
|---|---|---|---|---|---|
| 70000001 | Ana Ficticia Rojas | Ana F\*\*\* R\*\*\* | 1111 | Bs 5.000,00 | Activo |
| 70000002 | Bruno Ejemplo Mamani | Bruno E\*\*\* M\*\*\* | 2222 | Bs 800,00 | Activo |
| 70000003 | Carla Prueba Quispe | Carla P\*\*\* Q\*\*\* | 3333 | Bs 0,00 | Activo |
| 70000004 | Diego Demo Vargas | Diego D\*\*\* V\*\*\* | 4444 | Bs 1.200,00 | Bloqueado |

| Servicio | Empresa | Código | Periodo | Monto | Vence |
|---|---|---|---|---|---|
| Luz | Luz del Valle S.A. | LV-1001 | 2026-08 | Bs 185,40 | 2026-09-15 |
| Luz | Luz del Valle S.A. | LV-1001 | 2026-09 | Bs 172,10 | 2026-10-15 |
| Agua | Aguas Claras | AC-2002 | 2026-09 | Bs 64,00 | 2026-10-20 |
| Internet | NetAndes | NA-3003 | 2026-10 | Bs 249,00 | 2026-10-25 |
| Internet | NetAndes | NA-3004 | — sin deudas — | — | — |

Cada escenario parte del estado inicial (`POST /api/test/reset`, ADR-002), salvo que el *Dado* indique otra cosa.

## Criterios transversales (aplican a todas las historias)

- **CT-01 Montos:** se muestran como `Bs 1.234,50`; viajan en la API como cadena `"1234.50"`; nunca se redondean (ADR-005).
- **CT-02 Fechas:** se muestran en hora de Bolivia (UTC−4) con formato `dd/MM/aaaa HH:mm` (ADR-005).
- **CT-03 Logs:** nunca contienen el PIN, saldos ni celulares completos; celular `******01`, nombre `Ana F*** R***`, código `LV-**01` (ADR-007).
- **CT-04 Sesión:** toda pantalla salvo el login requiere sesión; un `401` lleva al login (ADR-003).
- **CT-05 Errores:** la API responde `ProblemDetails` con `codigo` y `detail`; la interfaz muestra `detail` (ADR-001).
- **CT-06 Interfaz móvil:** todas las pantallas se usan sin desplazamiento horizontal en un viewport de 390×844 (ADR-008).

## Catálogo de códigos de error

| Código | HTTP | Mensaje al usuario | Historia |
|---|---|---|---|
| `SOLICITUD_INVALIDA` | 400 | No se pudo procesar la solicitud | Todas (cuerpo o parámetros malformados) |
| `CELULAR_INVALIDO` | 400 | Ingresa un celular válido de 8 dígitos | HU-01, HU-06 |
| `PIN_INVALIDO` | 400 | Ingresa un PIN de 4 dígitos | HU-01, HU-09, HU-13 |
| `SESION_EXPIRADA` | 401 | Tu sesión expiró. Ingresa nuevamente. | HU-04 |
| `CREDENCIALES_INVALIDAS` | 401 | Celular o PIN incorrectos | HU-01, HU-02, HU-03 |
| `ACCESO_BLOQUEADO_TEMPORAL` | 423 (login) / 401 (confirmación) | Demasiados intentos. Intenta nuevamente en X minutos. | HU-02 |
| `CUENTA_BLOQUEADA` | 403 | Tu cuenta está bloqueada. Comunícate con soporte. | HU-03 |
| `PIN_INCORRECTO` | 422 | PIN incorrecto. Te quedan N intentos. | HU-02, HU-09, HU-13 |
| `DESTINATARIO_NO_DISPONIBLE` | 422 | El destinatario no está disponible | HU-06 |
| `TRANSFERENCIA_A_SI_MISMO` | 422 | No puedes transferirte a ti mismo | HU-06 |
| `MONTO_INVALIDO` | 400 | Ingresa un monto válido | HU-07 |
| `MONTO_NO_POSITIVO` | 400 | El monto debe ser mayor a Bs 0 | HU-07 |
| `MONTO_DECIMALES` | 400 | El monto admite como máximo 2 decimales | HU-07 |
| `GLOSA_LARGA` | 400 | La glosa admite como máximo 60 caracteres | HU-07 |
| `SALDO_INSUFICIENTE` | 422 | Saldo insuficiente | HU-07, HU-13 |
| `LIMITE_POR_TRANSFERENCIA` | 422 | El monto máximo por transferencia es Bs 3.000,00 | HU-08 |
| `LIMITE_DIARIO` | 422 | Superas el límite diario de Bs 10.000. Disponible hoy: Bs X | HU-08 |
| `IDEMPOTENCIA_CLAVE_REQUERIDA` | 400 | No se pudo procesar la solicitud. Intenta nuevamente. | HU-10, HU-14 |
| `IDEMPOTENCIA_CONFLICTO` | 422 | La solicitud no coincide con una operación anterior | HU-10, HU-14 |
| `CODIGO_CLIENTE_INEXISTENTE` | 422 | El código de cliente no existe en {empresa} | HU-11 |
| `SERVICIO_NO_DISPONIBLE` | 503 | El servicio de {empresa} no está disponible. Intenta más tarde. | HU-12 |
| `DEUDA_YA_PAGADA` | 422 | Esta deuda ya fue pagada | HU-14 |
| `DEUDA_NO_ES_LA_MAS_ANTIGUA` | 422 | Paga primero el periodo {periodo} | HU-13 |
| `RANGO_FECHAS_INVALIDO` | 400 | La fecha inicial no puede ser posterior a la final | HU-16 |
| `OPERACION_NO_ENCONTRADA` | 404 | No encontramos esa operación | HU-17 |
| `ERROR_INTERNO` | 500 | Ocurrió un error. Tu saldo no fue modificado. Intenta nuevamente. | HU-09, HU-13 |

## Supuestos de las historias

Complementan los supuestos S-01 a S-08 de [`01-adr/README.md`](../01-adr/README.md).

- **SH-01.** El celular tiene exactamente 8 dígitos numéricos.
- **SH-02.** Hay un botón **Cerrar sesión** visible en el inicio (la especificación no lo pide, pero es necesario en una app de dinero).
- **SH-03.** Una deuda vencida **se puede pagar**; se muestra con la etiqueta "Vencida".
- **SH-04.** El historial no se pagina: la cantidad de operaciones es pequeña.
- **SH-05.** Sin filtros, el historial muestra todas las operaciones del usuario.
- **SH-06.** Si el usuario no tiene operaciones, el inicio y el historial muestran "Aún no tienes movimientos".
