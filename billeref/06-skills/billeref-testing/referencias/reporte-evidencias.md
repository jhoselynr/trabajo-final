# Registrar evidencias en el reporte de ejecución

La matriz (`04-plan-de-pruebas/matriz-trazabilidad.md`) dice **qué** se prueba y qué evidencia se espera; el reporte (`08-evidencias/reporte-ejecucion.md`) dice **qué pasó** al ejecutarlo. La matriz no se edita al ejecutar.

## 1. Estructura de `08-evidencias/`

```
08-evidencias/
├── reporte-ejecucion.md          # un único reporte vivo (desde la plantilla)
├── reportes/                     # salidas de herramientas
│   ├── backend.trx
│   ├── junit.xml
│   └── coverage/                 # cobertura de backend y frontend
└── TC-09-02/
    ├── TC-09-02_comprobante.png
    └── TC-09-02_notas.md         # opcional: pasos ejecutados y observaciones
```

## 2. Qué guardar según el tipo

| Tipo | Archivo | Contenido |
|---|---|---|
| E2E | `TC-HH-NN_<descripcion>.png` | Captura del estado final que muestra lo que pide la columna "Evidencia esperada"; si la evidencia menciona pasos intermedios (p. ej. "Te quedan 2 intentos" y luego el login), una captura por paso con sufijo `_1`, `_2` |
| API | `TC-HH-NN_resultado.txt` | Salida de `dotnet test --filter "FullyQualifiedName~TC_HH_NN" --logger "console;verbosity=normal"` con el nombre del test y "Passed"/"Failed" |
| API (si la evidencia habla de respuestas) | `TC-HH-NN_respuestas.json` | Estado, cabeceras relevantes (`Idempotent-Replayed`) y cuerpo de las respuestas, **sin** token, PIN ni celulares completos |
| Unitaria | `TC-HH-NN_resultado.txt` | Salida de `dotnet test --filter …` o `npx jest -t "TC-HH-NN"` |
| Dos tipos (`E2E · API`) | Ambos archivos | Una sola fila en el reporte con los dos enlaces |

Reglas para las evidencias:
- **Sin datos sensibles reales**: ni PIN, ni tokens, ni la clave JWT. Los celulares y nombres de la semilla son ficticios y pueden aparecer en capturas.
- Una captura debe poder entenderse sola: tiene que verse el texto o el valor que el criterio exige.
- Nunca editar una captura; si no muestra lo necesario, repetir el caso.

## 3. Registrar un caso

1. Si `08-evidencias/reporte-ejecucion.md` no existe, crearlo copiando [`../plantillas/reporte-ejecucion.md`](../plantillas/reporte-ejecucion.md) y completar el encabezado (fecha, commit con `git rev-parse --short HEAD`, rama, entorno).
2. En la tabla **Resultados por caso**, actualizar la fila del `TC` (cada caso aparece una sola vez; se sobrescribe con la última ejecución):
   - **Fecha:** `AAAA-MM-DD`.
   - **Resultado:** `Aprobado`, `Fallido` o `Bloqueado`.
   - **Evidencia:** enlaces relativos a los archivos, p. ej. `[captura](TC-09-02/TC-09-02_comprobante.png)`.
   - **Defecto:** `D-NN` si falló; vacío si no.
   - **Notas:** breve; obligatoria si es `Bloqueado` (la causa).
3. **Si falló**, agregar el defecto en la tabla **Defectos**:
   - `D-NN` correlativo, severidad (Crítica / Alta / Media / Baja según el plan de pruebas §8), caso, regla o criterio afectado, resultado esperado (del criterio) y obtenido, estado (`Abierto` / `Corregido` / `Verificado`).
   - Al corregirlo, volver a ejecutar el caso, actualizar su fila y pasar el defecto a `Verificado`.
4. **Actualizar el resumen**: ejecutados, aprobados, fallidos y bloqueados por tipo, y el estado de cada criterio de salida.

## 4. Criterios de salida en el reporte

Al cierre (tarea T-28) el resumen debe mostrar, con datos del propio reporte:

| Criterio (plan §9) | Cómo se comprueba en el reporte |
|---|---|
| 104 casos ejecutados | Ninguna fila sin resultado; `Bloqueado` solo con causa |
| 0 defectos Críticos o Altos abiertos | Tabla de defectos |
| 100 % aprobados en HU-02, HU-03, HU-07 a HU-10, HU-13, HU-14 | Filtrar esas filas |
| ≥ 95 % aprobados en total | Resumen |
| NF-01 a NF-06 aprobadas | Tabla de verificaciones no funcionales |
| Cobertura de `BilleRef.Domain` ≥ 80 % | Valor del reporte de cobertura en `reportes/coverage/` |
| Evidencia de cada caso | Ninguna fila `Aprobado` sin enlace |
