# Feature: Blocks

## Propósito

Gestiona los bloques diarios del usuario: obtención desde Supabase/SQLite (offline-first), completado y aplicación de templates a una fecha.

## Componentes principales

- Ninguno en esta carpeta (la vista "Hoy" está en `dashboard/hoy`).

## Servicios y dependencias

- **BlocksRepository**: operaciones sobre `daily_blocks` y `daily_schedule`.
  - `getDailyBlocks(userId, date)`: obtiene bloques del día (red → cache local).
  - `completeBlock(blockId, note?)`: marca bloque como completado (local primero, luego sync).
  - `applyTemplateToDay(userId, templateId, date)`: crea `daily_schedule` y `daily_blocks` desde un template.
- Depende de: `SQLiteService`, `SupabaseService`, `SyncService`, `NetworkService`, `TemplatesRepository`.

## Ejemplos de uso

```typescript
// En un componente
private blocksRepo = inject(BlocksRepository);

const blocks = await this.blocksRepo.getDailyBlocks(userId, today);
await this.blocksRepo.completeBlock(block.id);
await this.blocksRepo.applyTemplateToDay(userId, templateId, today);
```
