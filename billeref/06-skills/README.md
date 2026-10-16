# Skills · BilleRef

Skills de Claude Code específicas del proyecto. Cada carpeta tiene un `SKILL.md` con su descripción (cuándo usarla) e instrucciones, y se apoyan en `01-adr/`, `02-historias/`, `03-especificaciones/`, `04-plan-de-pruebas/` y `05-desarrollo/`.

| Skill | Para qué | Se apoya en |
|---|---|---|
| [`billeref-testing`](billeref-testing/SKILL.md) | Escribir y ejecutar pruebas a partir de los casos `TC-HH-NN` (comandos por caso, historia y suite); E2E con Playwright MCP y los datos semilla ([referencia](billeref-testing/referencias/playwright-mcp.md)); registro de evidencias en `08-evidencias/reporte-ejecucion.md` ([referencia](billeref-testing/referencias/reporte-evidencias.md), [plantilla](billeref-testing/plantillas/reporte-ejecucion.md)) | Matriz, plan de pruebas, ADR-008 |
| [`billeref-convenciones-backend`](billeref-convenciones-backend/SKILL.md) | Código limpio, reglas obligatorias y checklist de revisión (montos, logs, transacciones, mensajes de error) del backend .NET 10 | ADR-001 a 007, README y SPEC |
| [`billeref-convenciones-frontend`](billeref-convenciones-frontend/SKILL.md) | Código limpio, reglas obligatorias y checklist de revisión (montos, logs, transacciones, mensajes de error) del frontend Angular | ADR-003, 004, 005; SPEC; CT-01 a CT-06 |
| [`billeref-revision`](billeref-revision/SKILL.md) | Revisar un cambio contra SPEC, ADR, matriz y convenciones, con severidades del plan de pruebas | Todas las anteriores |

## Cómo se usan juntas

1. Al implementar una tarea: `billeref-testing` (primero las pruebas) + la skill de convenciones del lado que corresponda.
2. Antes de un commit de cierre de tarea o de fusionar una fase: `billeref-revision`.

## Activación

Claude Code carga las skills de proyecto desde `.claude/skills/<nombre>/SKILL.md`. Aquí se activan con **uniones de directorio** (*junctions*) que apuntan a `06-skills/`: no requieren permisos de administrador y mantienen una sola copia, así que editar `06-skills/` actualiza la skill activa.

Ejecutar una vez por clon, desde `billeref/` (PowerShell):

```powershell
New-Item -ItemType Directory -Force .claude\skills | Out-Null
foreach ($s in "billeref-testing","billeref-convenciones-backend","billeref-convenciones-frontend","billeref-revision") {
  New-Item -ItemType Junction -Path ".claude\skills\$s" -Target (Resolve-Path "06-skills\$s").Path
}
```

- `.claude/skills/` está en `.gitignore`: git atraviesa las uniones y, sin esa exclusión, subiría cada skill dos veces.
- Claude Code detecta las skills al iniciar la sesión; si ya había una abierta, reiniciarla.
- Una vez activas, se invocan por su nombre (`/billeref-revision`) o Claude las elige según su descripción.
- Para desactivar una skill, borrar solo la unión (`Remove-Item .claude\skills\<nombre>`), nunca la carpeta de `06-skills/`.
