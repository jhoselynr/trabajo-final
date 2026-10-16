---
name: billeref-convenciones-frontend
description: Convenciones y principios de código limpio para el frontend de BilleRef (Angular, PWA mobile-first, TypeScript). Usar al crear o modificar componentes, servicios, interceptores, guards, pipes, formularios o estilos en 05-desarrollo/frontend, para que respeten los ADR, las especificaciones y los criterios transversales CT-01 a CT-06.
---

# Convenciones del frontend de BilleRef

Fuente de verdad: `01-adr/` (en especial ADR-003 y ADR-005), `03-especificaciones/README.md` (DTO) y la `SPEC-HU-HH` de la pantalla que se implementa. Los textos visibles salen de los criterios de `02-historias/` y del catálogo de errores, **textualmente**.

## Estructura

```
src/app/
├── core/         # AuthService, interceptor, guard, InactividadService, ApiErrorService, modelos (DTO)
├── shared/       # pipes (bs, fechaBolivia), componentes de UI reutilizables, validadores
└── features/
    ├── acceso/        # HU-01 a HU-04
    ├── inicio/        # HU-05
    ├── transferencias/# HU-06 a HU-10
    ├── pagos/         # HU-11 a HU-14
    └── historial/     # HU-15 a HU-17 (incluye la pantalla de comprobante)
```

- Componentes *standalone* con `ChangeDetectionStrategy.OnPush`.
- Rutas con *lazy loading* por feature; todas salvo `/login` protegidas por el *guard* (R-04.6).

## Principios de código limpio aplicados

- **Componentes contenedores y de presentación.** El contenedor habla con el servicio y maneja estado; el de presentación recibe `@Input` y emite `@Output`, sin inyectar servicios HTTP.
- **Un servicio de API por feature** (`TransferenciasApi`, `PagosApi`…), con métodos que reflejan los endpoints de la SPEC; los componentes nunca usan `HttpClient` directamente.
- **Sin lógica en plantillas:** nada de cálculos ni llamadas a métodos con lógica en el HTML; usar pipes o propiedades derivadas.
- **Nombres del dominio en español, iguales a las SPEC y los DTO** (`numeroOperacion`, `saldoResultante`, `nombreEnmascarado`); archivos en *kebab-case* (`confirmar-transferencia.component.ts`).
- **Tipos estrictos:** `strict` en `tsconfig`, interfaces para cada DTO del README de SPEC, uniones literales para enums (`'TRANSFERENCIA_ENVIADA' | 'TRANSFERENCIA_RECIBIDA' | 'PAGO_SERVICIO'`); prohibido `any`.
- **Funciones y componentes pequeños**; si un componente supera una pantalla de responsabilidad, se divide.
- **Sin números mágicos:** constantes compartidas (`INACTIVIDAD_MS = 5 * 60_000`, `RENOVAR_ANTES_MS = 60_000`, `MAX_GLOSA = 60`, `TIMEOUT_DEUDAS_MS = 30_000`).
- **Comentarios** solo con el ID de regla si no es obvio (`// R-04.2`).

## Reglas obligatorias

### Dinero y fechas (ADR-005, CT-01, CT-02)
- Los montos son **`string`** en todo el frontend; **ningún cálculo de dinero** (total, comisión, disponible y saldo resultante vienen del backend).
- Entrada de monto: aceptar coma o punto, normalizar a punto antes de enviar, sin separador de miles (R-07.1). Validador compartido equivalente al del backend.
- Mostrar con el pipe `bs` → `Bs 1.234,50`, y fechas con `fechaBolivia` → `dd/MM/aaaa HH:mm` en `America/La_Paz`.

### Sesión (ADR-003, SPEC-HU-04)
- El token vive **solo en memoria** (`AuthService`); prohibido `localStorage`, `sessionStorage`, cookies o IndexedDB para la sesión. Recargar la página cierra la sesión (S-08).
- *Interceptor* único: agrega `Authorization`, reemplaza el token con `X-Renewed-Token` (conserva el de `exp` mayor) y ante `401` descarta el token y navega al login con el mensaje correspondiente.
- `InactividadService`: 5 min sin `click`, `keydown`, `touchstart` o navegación → logout y "Tu sesión se cerró por inactividad"; al volver de segundo plano comparar con la hora real. Si hay actividad y al token le queda < 60 s → `POST /api/auth/renovar`.

### Operaciones de dinero (ADR-004, SPEC-HU-10/14)
- La `Idempotency-Key` (`crypto.randomUUID()`) se genera **al entrar a la pantalla de confirmación** y se reutiliza en todo reintento (incluido un PIN incorrecto); volver a editar genera una nueva.
- El botón Confirmar se deshabilita desde el toque hasta la respuesta.
- "Cancelar" no envía ninguna solicitud.

### Formularios y datos sensibles
- Formularios reactivos con validadores tipados para celular (`^\d{8}$`, quitando espacios), PIN (`^\d{4}$`), monto y glosa (`maxlength=60`).
- Campo PIN: `type="password"`, `inputmode="numeric"`, `maxlength="4"`, `autocomplete="off"`; se vacía tras cada envío (R-01.6).
- Nunca `console.log` de PIN, token, celulares ni saldos.
- Los mensajes de error que vienen del backend se muestran con su `detail`; los de validación local usan exactamente los textos del catálogo.

### Integración con pagos (SPEC-HU-11/12)
- "Consultando deudas…" mientras la consulta está en curso; timeout HTTP de 30 s; con `503`, mostrar el mensaje y el botón Reintentar.
- Solo la deuda con `pagable: true` es seleccionable; las demás muestran `motivoNoPagable`.

### Interfaz móvil (CT-06)
- *Mobile-first*: diseñada para 390×844 sin desplazamiento horizontal; unidades relativas, sin anchos fijos mayores a la pantalla.
- Cada campo con `<label>` asociado; botones con texto visible igual al de los criterios ("Ingresar", "Confirmar", "Cancelar", "Reintentar", "Cerrar sesión").

## Estilo

- `ng lint` y Prettier sin errores antes de cada commit.
- Observables con `async` pipe o `takeUntilDestroyed`; sin suscripciones manuales sin cierre.

## Checklist de revisión

Recorrerlo completo antes de dar por terminada una tarea o de pedir una revisión (`billeref-revision`). Cada punto incumplido es un hallazgo; entre paréntesis, la regla que lo respalda.

### Montos
- [ ] Los montos son `string` en modelos, formularios y servicios; no se convierten a `number` para operar (ADR-005).
- [ ] No hay ninguna suma, resta, multiplicación ni redondeo de dinero: total, comisión, disponible del día y saldo resultante vienen del backend (R-11.8, R-13.1).
- [ ] La entrada acepta coma o punto, se normaliza a punto antes de enviar y rechaza separadores de miles y más de 2 decimales con el mismo orden de validación que el backend (R-07.1 a R-07.4).
- [ ] Todos los montos visibles pasan por el pipe `bs` (`Bs 1.234,50`) y los movimientos muestran el signo (`+Bs 150,50`, `-Bs 250,00`) (CT-01).
- [ ] El límite por transferencia se valida antes de continuar con el mensaje del catálogo; el límite diario y el saldo se dejan al backend (R-08.1, R-07.6).

### Logs sin datos sensibles
- [ ] No hay `console.log`, `console.error` ni reportes de errores que incluyan PIN, token, celulares, saldos ni cuerpos de solicitudes (ADR-007).
- [ ] El token vive solo en memoria (`AuthService`); no se usa `localStorage`, `sessionStorage`, cookies ni IndexedDB para la sesión (ADR-003, S-08).
- [ ] El campo PIN es `type="password"`, `inputmode="numeric"`, `maxlength="4"`, `autocomplete="off"` y se vacía tras cada envío (R-01.6).
- [ ] Celular, código de cliente y PIN se envían solo en el cuerpo de `POST`; ninguna URL ni parámetro de ruta los contiene (ADR-001).
- [ ] Los mensajes de error mostrados no incluyen detalles técnicos ni el `traceId` en texto destacado.

### Transacciones (operaciones de dinero)
- [ ] La `Idempotency-Key` se genera con `crypto.randomUUID()` **al entrar a la pantalla de confirmación** y se envía en `POST /api/transferencias` y `POST /api/pagos` (R-10.1).
- [ ] La misma clave se reutiliza en todo reintento de esa confirmación, incluido el reingreso del PIN tras `PIN_INCORRECTO`; volver a editar los datos genera una clave nueva.
- [ ] El botón Confirmar se deshabilita desde el toque hasta la respuesta (R-10.8); no hay reintentos automáticos del cliente sobre `POST` de dinero.
- [ ] "Cancelar" no envía ninguna solicitud y vuelve al inicio (R-09.8).
- [ ] Tras `422 PIN_INCORRECTO` se queda en la confirmación mostrando los intentos restantes; tras `401 ACCESO_BLOQUEADO_TEMPORAL` descarta el token y va al login (R-02.5, R-09.2).
- [ ] La confirmación del pago muestra monto, comisión y total **del backend**; solo la deuda con `pagable: true` es seleccionable (R-11.4, R-13.1).
- [ ] El saldo y los movimientos se vuelven a pedir al backend al entrar al inicio después de una operación (R-05.6).

### Mensajes de error según la SPEC
- [ ] Los errores del backend se muestran con su `detail` tal cual; no se reescriben ni traducen en el frontend.
- [ ] Los mensajes de validación local son **textualmente** los del catálogo de `02-historias/README.md` ("Ingresa un celular válido de 8 dígitos", "El monto admite como máximo 2 decimales", "La glosa admite como máximo 60 caracteres", "La fecha inicial no puede ser posterior a la final"…).
- [ ] Los mensajes propios del frontend coinciden con los criterios: "Tu sesión se cerró por inactividad", "Tu sesión expiró. Ingresa nuevamente.", "Aún no tienes movimientos", "No hay operaciones para los filtros elegidos", "Consultando deudas…".
- [ ] El manejo por código HTTP es el de la SPEC: `401` → login; `422` → mensaje en la pantalla actual; `503` → mensaje + botón "Reintentar"; `500` → mensaje genérico sin perder lo ingresado.
- [ ] Cada código de error del catálogo que la pantalla puede recibir tiene una prueba Jest que verifica el texto mostrado.

### General
- [ ] Pruebas Jest `describe('TC-HH-NN …')` para la lógica nueva (skill `billeref-testing`).
- [ ] Sin `any`; DTO tipados según el README de SPEC.
- [ ] Se ve a 390 px sin desplazamiento horizontal (CT-06).
- [ ] `ng build`, `ng lint` y `npx jest` en verde.
