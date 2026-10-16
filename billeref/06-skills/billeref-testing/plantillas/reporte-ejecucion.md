# Reporte de ejecución de pruebas · BilleRef

- **Fecha de la última actualización:** AAAA-MM-DD
- **Commit probado:** `xxxxxxx` · **Rama:** `…`
- **Entorno:** Windows 11 · .NET 10 · Node LTS · Chromium (Playwright MCP) 390×844 `America/La_Paz` · `Servicios__TimeoutSegundos=2`
- **Plan:** [plan-pruebas.md](../04-plan-de-pruebas/plan-pruebas.md) · **Matriz:** [matriz-trazabilidad.md](../04-plan-de-pruebas/matriz-trazabilidad.md)

## Resumen

| Tipo | Casos | Ejecutados | Aprobados | Fallidos | Bloqueados |
|---|---|---|---|---|---|
| E2E | 58 | 0 | 0 | 0 | 0 |
| API | 46 | 0 | 0 | 0 | 0 |
| Unitaria | 12 | 0 | 0 | 0 | 0 |
| **Casos únicos** | **104** | **0** | **0** | **0** | **0** |

Un caso con dos tipos cuenta como aprobado solo si ambos lo están.

## Criterios de salida (plan §9)

| # | Criterio | Estado | Dato |
|---|---|---|---|
| 1 | 104 casos ejecutados | Pendiente | 0/104 |
| 2 | 0 defectos Críticos o Altos abiertos | Pendiente | — |
| 3 | 100 % aprobados en dinero y seguridad | Pendiente | — |
| 4 | ≥ 95 % aprobados en total | Pendiente | — |
| 5 | NF-01 a NF-06 aprobadas | Pendiente | — |
| 6 | Cobertura de `BilleRef.Domain` ≥ 80 % | Pendiente | — |
| 7 | Evidencia de cada caso | Pendiente | — |

## Verificaciones no funcionales

| ID | Verificación | Fecha | Resultado | Evidencia |
|---|---|---|---|---|
| NF-01 | Logs sin datos sensibles | | | |
| NF-02 | Sin secretos en el repositorio | | | |
| NF-03 | PIN con hash en la semilla | | | |
| NF-04 | Concurrencia (20 repeticiones) | | | |
| NF-05 | Sin desplazamiento horizontal a 390 px | | | |
| NF-06 | Token vencido rechazado sin tolerancia | | | |

## Resultados por caso

Una fila por caso de la matriz; se sobrescribe con la última ejecución.

| Caso | Criterio | Tipo | Fecha | Resultado | Evidencia | Defecto | Notas |
|---|---|---|---|---|---|---|---|
| TC-01-01 | CA-01.1 | E2E | | | | | |
| TC-09-02 | CA-09.2 | E2E | 2026-10-20 | Aprobado | [captura](TC-09-02/TC-09-02_comprobante.png) | | Ejemplo: reemplazar al usar |

## Defectos

| ID | Severidad | Caso | Regla / criterio | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|---|
| D-01 | Crítica | TC-10-01 | R-10.9, CA-10.1 | Un solo débito con dos envíos de la misma clave | Dos débitos con envíos simultáneos | Ejemplo: reemplazar al usar |
