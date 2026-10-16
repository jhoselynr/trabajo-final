---
name: billeref-revision
description: Revisar cambios de código de BilleRef (un diff, una rama, un PR o una tarea T-xx terminada) contra las especificaciones, ADR, criterios de aceptación y convenciones del proyecto. Usar cuando se pida revisar, auditar o validar código de 05-desarrollo antes de un commit, una fusión o el cierre de una tarea o fase.
---

# Revisión de código de BilleRef

Una revisión de BilleRef responde una pregunta: **¿el cambio cumple exactamente lo que dicen las SPEC y los ADR, y está probado como dice la matriz?** No es una revisión de gustos.

## Procedimiento

1. **Delimitar el cambio.** Obtener el diff (`git diff main...HEAD`, el PR o los archivos indicados) e identificar las tareas `T-xx` de `05-desarrollo/tareas.md` y las historias `HU-HH` que toca.
2. **Cargar la referencia, solo la necesaria:** la `SPEC-HU-HH` de cada historia (reglas, contrato, errores, casos borde), el README de `03-especificaciones/` si toca dinero o DTO, los ADR citados por la SPEC, y las filas de la matriz para esos TC.
3. **Recorrer la lista de verificación** de abajo. Cada hallazgo debe poder señalar un archivo y una línea, y la regla, criterio o ADR que incumple.
4. **Verificar, no suponer.** Antes de reportar, confirmar leyendo el código (y, si es posible, ejecutando `dotnet test` / `npx jest`) que el problema existe. Descartar lo que no se pueda demostrar.
5. **Reportar** con el formato de salida.

## Lista de verificación

### 1. Trazabilidad
- Cada regla `R-HH.N` implementada tiene su prueba con el ID del caso (`TC_HH_NN_…` / `describe('TC-HH-NN …')`).
- Los TC de la tarea están todos presentes y en el nivel que indica la matriz.
- Si el código se desvía de la SPEC, la SPEC (y la historia, la matriz o el catálogo) se actualizó en el mismo cambio.
- `tareas.md` y `bitacora-sesiones.md` reflejan el trabajo.

### 2. Contrato (SPEC, sección 2 y 3)
- Ruta, método, nombres de campos (camelCase, en español), tipos y códigos HTTP idénticos a la SPEC.
- `codigo` y mensaje de error idénticos al catálogo de `02-historias/README.md`.
- Los extras del `ProblemDetails` (`intentosRestantes`, `minutosRestantes`, `disponibleHoy`) presentes donde la SPEC los pide.

### 3. Dinero — severidad Crítica si falla
- `decimal` en C#, cadena en JSON, ningún redondeo de lo ingresado; el frontend no calcula montos.
- Transferencias y pagos usan el pipeline común con el orden del README de SPEC: PIN fuera del lock; dentro del lock idempotencia → reglas → aplicar → guardar clave.
- Sin `await`, E/S ni llamadas al gateway en el paso de aplicación; restauración de valores ante excepción.
- Idempotencia: huella sin PIN, solo éxitos guardan clave, repetición devuelve el cuerpo original con `Idempotent-Replayed: true`, vigencia 24 h.
- El monto del pago sale del repositorio; deuda más antigua y estado verificados dentro del lock.
- Límite diario por día calendario de Bolivia, solo transferencias enviadas exitosas, evaluado dentro del lock.

### 4. Seguridad y privacidad — severidad Crítica o Alta
- PIN: nunca en logs, respuestas, almacenamiento ni huellas; verificación con `PasswordHasher`; hash ficticio para celulares inexistentes.
- Celular, código de cliente y PIN nunca en URLs.
- Logs con `Mascaras.*`; sin saldos ni cabeceras sensibles; sin `UseHttpLogging`.
- JWT con `ClockSkew = 0`, `sid` revocable, clave fuera del repositorio.
- Token solo en memoria en el frontend.
- Respuestas que no revelan existencia (celular inexistente, comprobante ajeno → `404`).
- El destinatario nunca recibe `saldoResultanteOrigen`.

### 5. Tiempo
- `TimeProvider` en todo; ningún `DateTime.Now` / `UtcNow`.
- Bolivia −04:00 fijo; rangos `[inicio, fin)`; fechas de respuesta con desplazamiento.

### 6. Convenciones y código limpio
- Backend: skill `billeref-convenciones-backend` (capas, nombres del dominio, constantes, errores centralizados).
- Frontend: skill `billeref-convenciones-frontend` (estructura, contenedor/presentación, textos exactos, móvil).

### 7. Pruebas
- Siguen la skill `billeref-testing`: factory nueva por prueba, relojes falsos, saldo verificado en cada prueba de dinero, concurrencia repetida 20 veces, sin esperas reales.
- Las pruebas fallarían si la regla se rompiera (no son tautológicas).

## Severidad

Usar la escala del plan de pruebas (§8):

| Severidad | Cuándo |
|---|---|
| Crítica | Puede perder o duplicar dinero, o exponer el PIN |
| Alta | Incumple una regla de negocio o seguridad sin pérdida de dinero |
| Media | Comportamiento incorrecto con alternativa, contrato o mensaje distinto a la SPEC, prueba faltante |
| Baja | Convenciones, legibilidad, cosmético |

## Formato de salida

```markdown
## Revisión · <rama o T-xx> · <fecha>

**Veredicto:** Aprobado | Aprobado con observaciones | Cambios requeridos
(Cambios requeridos si hay al menos un hallazgo Crítico o Alto.)

| # | Severidad | Archivo:línea | Incumple | Hallazgo | Sugerencia |
|---|---|---|---|---|---|
| 1 | Crítica | src/BilleRef.Api/.../TransferenciasController.cs:42 | R-09.4, ADR-002 | Se debita antes de registrar la operación sin restaurar ante excepción | Usar el pipeline común (T-17) |

**Cobertura de la tarea:** TC esperados N · presentes M · faltantes: TC-…
**Fuera de alcance revisado:** lo que no se pudo verificar y por qué.
```

Si no hay hallazgos, decirlo explícitamente e indicar qué se verificó.
