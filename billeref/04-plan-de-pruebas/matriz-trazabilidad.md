# Matriz de trazabilidad · BilleRef

- **Plan:** [plan-pruebas.md](plan-pruebas.md)
- **Cadena completa:** historia (`HU-HH`) → criterio (`CA-HH.N`, en [02-historias](../02-historias/README.md)) → regla (`R-HH.N`, en [03-especificaciones](../03-especificaciones/README.md)) → caso de prueba (`TC-HH-NN`).
- **Convención:** el caso `TC-HH-NN` verifica el criterio `CA-HH.N`; hay exactamente un caso por criterio.
- **Tipos:** `Unitaria (front)` Jest · `Unitaria (back)` xUnit · `API` xUnit + `WebApplicationFactory` · `E2E` Playwright MCP en 390×844. Si hay dos tipos, se ejecutan ambos.
- **Evidencias:** en `08-evidencias/<TC-ID>/` (ver §10 del plan).

## Resumen

| Historia | Criterios | Casos | E2E | API | Unitaria |
|---|---|---|---|---|---|
| HU-01 | 7 | 7 | 4 | 3 | 1 |
| HU-02 | 6 | 6 | 2 | 4 | 0 |
| HU-03 | 4 | 4 | 2 | 2 | 0 |
| HU-04 | 6 | 6 | 6 | 2 | 1 |
| HU-05 | 5 | 5 | 5 | 1 | 0 |
| HU-06 | 6 | 6 | 4 | 1 | 1 |
| HU-07 | 8 | 8 | 3 | 1 | 5 |
| HU-08 | 8 | 8 | 2 | 5 | 1 |
| HU-09 | 6 | 6 | 5 | 1 | 0 |
| HU-10 | 8 | 8 | 1 | 7 | 1 |
| HU-11 | 7 | 7 | 6 | 1 | 0 |
| HU-12 | 4 | 4 | 3 | 1 | 0 |
| HU-13 | 9 | 9 | 5 | 4 | 0 |
| HU-14 | 5 | 5 | 2 | 4 | 0 |
| HU-15 | 3 | 3 | 2 | 1 | 0 |
| HU-16 | 7 | 7 | 2 | 6 | 2 |
| HU-17 | 5 | 5 | 4 | 2 | 0 |
| **Total** | **104** | **104** | **58** | **46** | **12** |

## Matriz

| Historia | Criterio | Caso de prueba | Tipo | Evidencia esperada |
|---|---|---|---|---|
| HU-01 | CA-01.1 | TC-01-01 Ingreso exitoso | E2E | Captura de la pantalla de inicio con "Ana Ficticia Rojas" |
| HU-01 | CA-01.2 | TC-01-02 PIN incorrecto | E2E | Captura del mensaje "Celular o PIN incorrectos" en la pantalla de ingreso |
| HU-01 | CA-01.3 | TC-01-03 Celular inexistente responde igual que un PIN incorrecto | API | Respuestas de 79999999 y de PIN incorrecto idénticas (estado 401, código y mensaje) |
| HU-01 | CA-01.4 | TC-01-04 Celular con formato inválido | E2E | Captura del mensaje y registro de red sin llamada a `/api/auth/login` |
| HU-01 | CA-01.5 | TC-01-05 El PIN no se muestra | Unitaria (front) | Reporte Jest: campo PIN con `type=password`, `inputmode=numeric`, `maxlength=4` |
| HU-01 | CA-01.6 | TC-01-06 El PIN no aparece en los logs | API | Log capturado sin "1111" ni "70000001"; solo `******01` |
| HU-01 | CA-01.7 | TC-01-07 PIN con formato inválido | E2E · API | Captura del botón "Ingresar" deshabilitado; respuesta 400 `PIN_INVALIDO` y contador de intentos en 0 |
| HU-02 | CA-02.1 | TC-02-01 Tres PIN incorrectos seguidos bloquean el acceso | E2E | Captura del mensaje "Demasiados intentos. Intenta nuevamente en 5 minutos." |
| HU-02 | CA-02.2 | TC-02-02 Durante el bloqueo no se acepta ni el PIN correcto | API | Con reloj falso +2 min: 423 con `minutosRestantes: 3` y el mensaje con "3 minutos" |
| HU-02 | CA-02.3 | TC-02-03 El bloqueo termina a los 5 minutos | API | Con reloj falso +5 min: login 200 con el PIN correcto |
| HU-02 | CA-02.4 | TC-02-04 Un PIN correcto reinicia el contador | API | Secuencia de respuestas 401, 401, 200, 401 sin ningún 423 |
| HU-02 | CA-02.5 | TC-02-05 Los errores de PIN al confirmar cuentan para el bloqueo | E2E | Capturas de "Te quedan 2 intentos" y del login con el mensaje de bloqueo; saldo Bs 5.000,00 consultado por API |
| HU-02 | CA-02.6 | TC-02-06 Celular inexistente también se bloquea | API | Tercera respuesta para 79999999 es 423 `ACCESO_BLOQUEADO_TEMPORAL` |
| HU-03 | CA-03.1 | TC-03-01 Cuenta bloqueada con PIN correcto | E2E | Captura del mensaje "Tu cuenta está bloqueada. Comunícate con soporte." |
| HU-03 | CA-03.2 | TC-03-02 Cuenta bloqueada con PIN incorrecto no revela el bloqueo | E2E | Captura del mensaje "Celular o PIN incorrectos" para 70000004 |
| HU-03 | CA-03.3 | TC-03-03 Cuenta bloqueada también acumula intentos fallidos | API | Tercera respuesta para 70000004 es 423 |
| HU-03 | CA-03.4 | TC-03-04 Con PIN correcto se reinicia el contador | API | Secuencia 401, 401, 403, 401 sin 423 |
| HU-04 | CA-04.1 | TC-04-01 Cierre por inactividad | E2E | Con `page.clock` +5 min: captura del login con "Tu sesión se cerró por inactividad" |
| HU-04 | CA-04.2 | TC-04-02 La actividad mantiene la sesión abierta | Unitaria (front) · E2E | Reporte Jest: llamada a `/api/auth/renovar` antes del vencimiento; captura del comprobante tras 6 min simulados |
| HU-04 | CA-04.3 | TC-04-03 Recargar la página cierra la sesión | E2E | Captura del login después de `page.reload()` |
| HU-04 | CA-04.4 | TC-04-04 Cerrar sesión voluntariamente | E2E · API | Captura del login; `GET /api/inicio` con el token anterior responde 401 |
| HU-04 | CA-04.5 | TC-04-05 Pantallas protegidas sin sesión | E2E | Captura del login al abrir `/historial` sin sesión |
| HU-04 | CA-04.6 | TC-04-06 Sesión vencida en el servidor | API · E2E | Token vencido hace 1 s responde 401 `SESION_EXPIRADA`; captura del mensaje "Tu sesión expiró. Ingresa nuevamente." |
| HU-05 | CA-05.1 | TC-05-01 Usuario sin movimientos | E2E | Captura con "Ana Ficticia Rojas", "Bs 5.000,00" y "Aún no tienes movimientos" |
| HU-05 | CA-05.2 | TC-05-02 Usuario con saldo cero | E2E | Captura del inicio de Carla con "Bs 0,00" |
| HU-05 | CA-05.3 | TC-05-03 Solo se muestran los 5 movimientos más recientes | API · E2E | `GET /api/inicio` con 5 movimientos en orden descendente y saldo `4930.00`; captura de la lista |
| HU-05 | CA-05.4 | TC-05-04 Se muestran movimientos enviados, recibidos y pagos | E2E | Captura del inicio de Bruno con "+Bs 150,50" de "Ana F*** R***" y "-Bs 250,00" a NetAndes, el pago primero |
| HU-05 | CA-05.5 | TC-05-05 Accesos desde el inicio | E2E | Captura con los accesos Transferir, Pagar servicios, Historial y Cerrar sesión |
| HU-06 | CA-06.1 | TC-06-01 Destinatario activo | E2E | Captura del destinatario "Bruno E*** M***" |
| HU-06 | CA-06.2 | TC-06-02 Destinatario con cuenta bloqueada | E2E | Captura de "El destinatario no está disponible" para 70000004 y botón Continuar deshabilitado |
| HU-06 | CA-06.3 | TC-06-03 Destinatario inexistente | E2E | Captura de "El destinatario no está disponible" para 79999999 |
| HU-06 | CA-06.4 | TC-06-04 Transferencia a uno mismo | E2E | Captura de "No puedes transferirte a ti mismo" |
| HU-06 | CA-06.5 | TC-06-05 Celular con formato inválido | Unitaria (front) | Reporte Jest del validador de celular con "70A00002" |
| HU-06 | CA-06.6 | TC-06-06 El destinatario se bloquea antes de confirmar | API | Destino pasado a `BLOQUEADO` en la prueba: 422 `DESTINATARIO_NO_DISPONIBLE` y saldo de Ana sin cambios |
| HU-07 | CA-07.1 | TC-07-01 Montos válidos | Unitaria (front · back) | Reportes Jest y xUnit con los 4 montos válidos y su formato mostrado |
| HU-07 | CA-07.2 | TC-07-02 Montos inválidos | Unitaria (front · back) | Reportes Jest y xUnit con los 6 montos inválidos y su código de error |
| HU-07 | CA-07.3 | TC-07-03 Monto mayor al saldo | E2E | Captura de "Saldo insuficiente" y saldo de Bruno Bs 800,00 |
| HU-07 | CA-07.4 | TC-07-04 Usuario sin saldo | E2E | Captura de "Saldo insuficiente" para Carla |
| HU-07 | CA-07.5 | TC-07-05 Glosa opcional | E2E | Captura de la confirmación sin glosa |
| HU-07 | CA-07.6 | TC-07-06 Glosa de 60 caracteres | Unitaria (back) | Reporte xUnit: glosa de 60 caracteres aceptada |
| HU-07 | CA-07.7 | TC-07-07 Glosa de más de 60 caracteres | API · Unitaria (front) | Respuesta 400 `GLOSA_LARGA` con 61 caracteres; reporte Jest del `maxlength=60` |
| HU-07 | CA-07.8 | TC-07-08 Espacios al inicio y al final no cuentan | Unitaria (back) | Reporte xUnit: glosa rodeada de espacios se guarda recortada |
| HU-08 | CA-08.1 | TC-08-01 Monto igual al límite por transferencia | E2E | Captura del comprobante por "Bs 3.000,00" |
| HU-08 | CA-08.2 | TC-08-02 Monto mayor al límite por transferencia | E2E | Captura de "El monto máximo por transferencia es Bs 3.000,00" |
| HU-08 | CA-08.3 | TC-08-03 Llegar exactamente al límite diario | API | Acumulado preparado de 9000.00: transferencia de 1000.00 responde 201 |
| HU-08 | CA-08.4 | TC-08-04 Superar el límite diario | API | 422 `LIMITE_DIARIO` con `disponibleHoy: 1000.00` y saldo sin cambios |
| HU-08 | CA-08.5 | TC-08-05 El límite se reinicia a medianoche de Bolivia | API | Reloj falso 23:59 y 00:00 Bolivia: la transferencia del día nuevo responde 201 |
| HU-08 | CA-08.6 | TC-08-06 Las transferencias recibidas y los pagos no cuentan | API | Con recibidas y pagos preparados, transferencia de 1000.00 responde 201 |
| HU-08 | CA-08.7 | TC-08-07 Dos transferencias simultáneas no superan juntas el límite | API | Dos POST concurrentes: un 201 y un 422 con `disponibleHoy: 500.00` |
| HU-08 | CA-08.8 | TC-08-08 Monto con demasiados dígitos | Unitaria (front · back) | Reportes Jest y xUnit: "12345678" da `LIMITE_POR_TRANSFERENCIA` |
| HU-09 | CA-09.1 | TC-09-01 Pantalla de confirmación | E2E | Captura de la confirmación con destinatario, monto y glosa |
| HU-09 | CA-09.2 | TC-09-02 Transferencia exitosa | E2E | Captura del comprobante con número `OP-AAAAMMDD-NNNNNN`, fecha y saldo "Bs 4.849,50" |
| HU-09 | CA-09.3 | TC-09-03 Se refleja en ambos usuarios | E2E | Captura del inicio de Bruno con "Bs 950,50" y la transferencia recibida |
| HU-09 | CA-09.4 | TC-09-04 PIN incorrecto no realiza la transferencia | E2E | Captura de "PIN incorrecto. Te quedan 2 intentos." con saldo Bs 5.000,00 |
| HU-09 | CA-09.5 | TC-09-05 Cancelar en la confirmación | E2E | Captura del inicio con saldo Bs 5.000,00 después de cancelar |
| HU-09 | CA-09.6 | TC-09-06 Atomicidad ante un fallo interno | API | Falla inyectada en el repositorio: 500 `ERROR_INTERNO`, saldos de Ana y Bruno sin cambios, historial vacío |
| HU-10 | CA-10.1 | TC-10-01 Doble toque en "Confirmar" | API · E2E | Dos POST con la misma clave: 201 y 200 con el mismo número; un solo débito en el historial |
| HU-10 | CA-10.2 | TC-10-02 Reintento tras perder la respuesta | API | Repetición: 200 con `Idempotent-Replayed: true` y el mismo número de operación |
| HU-10 | CA-10.3 | TC-10-03 Misma clave con datos distintos | API | 422 `IDEMPOTENCIA_CONFLICTO` y saldo `4900.00` |
| HU-10 | CA-10.4 | TC-10-04 Dos transferencias iguales en confirmaciones distintas | API | Dos claves distintas: dos 201 y saldo `4800.00` |
| HU-10 | CA-10.5 | TC-10-05 Reintento tras un PIN incorrecto | API | 422 `PIN_INCORRECTO` y luego 201 con la misma clave; un solo débito |
| HU-10 | CA-10.6 | TC-10-06 Botón deshabilitado mientras se procesa | Unitaria (front) | Reporte Jest: botón Confirmar deshabilitado mientras la petición está pendiente |
| HU-10 | CA-10.7 | TC-10-07 Solicitud sin clave de idempotencia | API | 400 `IDEMPOTENCIA_CLAVE_REQUERIDA` y saldo sin cambios |
| HU-10 | CA-10.8 | TC-10-08 La clave vence a las 24 horas | API | Reloj falso +24 h 1 s: la repetición responde 201 con un número nuevo |
| HU-11 | CA-11.1 | TC-11-01 Empresas según el tipo de servicio | E2E | Captura de la lista de empresas de Luz con solo "Luz del Valle S.A." |
| HU-11 | CA-11.2 | TC-11-02 Código con varias deudas | E2E | Captura de LV-1001: 2026-08 "Vencida" y seleccionable, 2026-09 deshabilitada con "Paga primero el periodo 2026-08" |
| HU-11 | CA-11.3 | TC-11-03 Código con una deuda | E2E | Captura de AC-2002 con la deuda 2026-09 seleccionable |
| HU-11 | CA-11.4 | TC-11-04 Código sin deudas | E2E | Captura de "No tienes deudas pendientes con NetAndes" |
| HU-11 | CA-11.5 | TC-11-05 Código inexistente | E2E | Captura de "El código de cliente no existe en Luz del Valle S.A." |
| HU-11 | CA-11.6 | TC-11-06 Código de otra empresa | API | 422 `CODIGO_CLIENTE_INEXISTENTE` para AC-2002 en Luz del Valle |
| HU-11 | CA-11.7 | TC-11-07 Indicador de carga | E2E | Captura de "Consultando deudas…" con la empresa en modo `LENTO` |
| HU-12 | CA-12.1 | TC-12-01 La empresa no responde | E2E | Modo `LENTO` y timeout de 2 s: captura del mensaje y del botón Reintentar; saldo Bs 5.000,00 |
| HU-12 | CA-12.2 | TC-12-02 La empresa devuelve un error | E2E | Modo `FALLA`: captura del mensaje de servicio no disponible |
| HU-12 | CA-12.3 | TC-12-03 Reintento manual exitoso | E2E | Captura de las deudas de LV-1001 después de Reintentar en modo `NORMAL` |
| HU-12 | CA-12.4 | TC-12-04 El reintento automático recupera una falla pasajera | API | Gateway falso que falla una vez: respuesta 200 y 2 llamadas registradas |
| HU-13 | CA-13.1 | TC-13-01 Pantalla de confirmación del pago | E2E | Captura con monto "Bs 185,40", comisión "Bs 1,00" y total "Bs 186,40" |
| HU-13 | CA-13.2 | TC-13-02 Pago exitoso | E2E | Captura del comprobante con saldo resultante "Bs 4.813,60" |
| HU-13 | CA-13.3 | TC-13-03 Tras pagar la más antigua se habilita la siguiente | E2E | Captura de LV-1001 con 2026-09 como única deuda y seleccionable |
| HU-13 | CA-13.4 | TC-13-04 No se puede pagar una deuda que no es la más antigua | API | 422 `DEUDA_NO_ES_LA_MAS_ANTIGUA` y saldo `5000.00` |
| HU-13 | CA-13.5 | TC-13-05 Saldo insuficiente para monto más comisión | E2E | Captura de "Saldo insuficiente" para Carla con AC-2002 |
| HU-13 | CA-13.6 | TC-13-06 Saldo que cubre el monto pero no la comisión | API | Saldo preparado de 64.00: 422 `SALDO_INSUFICIENTE` |
| HU-13 | CA-13.7 | TC-13-07 PIN incorrecto no realiza el pago | E2E | Captura de "PIN incorrecto. Te quedan 2 intentos."; deuda NA-3003 sigue pendiente en la consulta |
| HU-13 | CA-13.8 | TC-13-08 Atomicidad ante un fallo interno | API | Falla inyectada: 500 `ERROR_INTERNO`, saldo `5000.00` y deuda `PENDIENTE` |
| HU-13 | CA-13.9 | TC-13-09 El monto lo define la deuda, no la solicitud | API | 201 con `total: 186.40` y saldo resultante `4813.60` pese al campo `monto: 1.00` |
| HU-14 | CA-14.1 | TC-14-01 Doble toque en "Confirmar" | API · E2E | Un solo pago en el historial y saldo `550.00` |
| HU-14 | CA-14.2 | TC-14-02 Reintento con la misma clave | API | 200 con `Idempotent-Replayed: true` y el mismo número de operación |
| HU-14 | CA-14.3 | TC-14-03 Intento nuevo sobre una deuda ya pagada | API | 422 `DEUDA_YA_PAGADA` y saldo `550.00` |
| HU-14 | CA-14.4 | TC-14-04 Deuda pagada desaparece de la consulta | E2E | Captura de "No tienes deudas pendientes con NetAndes" para NA-3003 |
| HU-14 | CA-14.5 | TC-14-05 Dos pagos simultáneos de la misma deuda con claves distintas | API | Dos POST concurrentes con claves distintas: un 201 y un 422 `DEUDA_YA_PAGADA`; saldo `550.00` |
| HU-15 | CA-15.1 | TC-15-01 Historial vacío | E2E | Captura del historial de Carla con "Aún no tienes movimientos" |
| HU-15 | CA-15.2 | TC-15-02 Historial con distintos tipos ordenado por fecha | E2E | Captura del historial de Ana con las 3 operaciones en orden y sus montos con signo |
| HU-15 | CA-15.3 | TC-15-03 No se ven operaciones de otros usuarios | API | `GET /api/historial` de Carla devuelve `operaciones: []` |
| HU-16 | CA-16.1 | TC-16-01 Filtrar por tipo | API | Datos fechados con reloj falso: con `tipo=TRANSFERENCIA_ENVIADA` solo la operación del 13/10 |
| HU-16 | CA-16.2 | TC-16-02 Filtrar por rango de fechas inclusivo | API | `desde=hasta=2026-10-14` devuelve solo la operación del 14/10 23:59 |
| HU-16 | CA-16.3 | TC-16-03 El límite del día se toma en hora de Bolivia | API · Unitaria (back) | `desde=hasta=2026-10-15` devuelve solo el pago de las 00:00; reporte xUnit de la conversión de fechas |
| HU-16 | CA-16.4 | TC-16-04 Combinar tipo y fechas | API · Unitaria (front) | Lista vacía con tipo y fechas combinados; reporte Jest del mensaje "No hay operaciones para los filtros elegidos" |
| HU-16 | CA-16.5 | TC-16-05 Rango de fechas inválido | E2E · API | Captura de "La fecha inicial no puede ser posterior a la final"; 400 `RANGO_FECHAS_INVALIDO` |
| HU-16 | CA-16.6 | TC-16-06 Quitar los filtros | E2E | Capturas de la lista filtrada y de la lista completa al quitar los filtros |
| HU-16 | CA-16.7 | TC-16-07 Solo fecha inicial | API | Solo `desde=2026-10-14`: devuelve las operaciones del 14/10 y del 15/10 |
| HU-17 | CA-17.1 | TC-17-01 Comprobante de una transferencia enviada | E2E | Captura del comprobante de Ana con "Bruno E*** M***", "Almuerzo" y saldo "Bs 4.849,50" |
| HU-17 | CA-17.2 | TC-17-02 Comprobante de una transferencia recibida | E2E · API | Captura del comprobante de Bruno con "Ana F*** R***" y "Bs 950,50"; el JSON no contiene `4849.50` |
| HU-17 | CA-17.3 | TC-17-03 Comprobante de un pago de servicio | E2E | Captura del comprobante del pago con saldo "Bs 4.813,60" |
| HU-17 | CA-17.4 | TC-17-04 No se puede ver el comprobante de otro usuario | API | 404 `OPERACION_NO_ENCONTRADA` para Carla |
| HU-17 | CA-17.5 | TC-17-05 Abrir el comprobante desde el inicio | E2E | Captura del comprobante abierto desde el inicio, igual al del historial |
