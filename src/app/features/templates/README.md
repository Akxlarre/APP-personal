# Feature: Templates

## Propósito

Templates de día (conjuntos de bloques reutilizables). CRUD de templates, bloques por template y aplicación de un template al día actual.

## Componentes principales

- **TemplatesListComponent**: lista de templates, creación/edición en dialog, botón "Aplicar a hoy" que llama a `BlocksRepository.applyTemplateToDay` y navega a Hoy.

## Servicios y dependencias

- **TemplatesRepository**: operaciones sobre `templates` y `blocks`.
  - `getTemplates(userId)`, `getBlocksByTemplateId(templateId)`, `createTemplate(...)`, `addBlockToTemplate(...)`.
- Depende de: `SQLiteService`, `SupabaseService`, `SyncService`, `NetworkService`.
- La UI usa además `BlocksRepository` para "Aplicar a hoy".

## Ejemplos de uso

```typescript
// En un componente
private repo = inject(TemplatesRepository);

const templates = await this.repo.getTemplates(userId);
const blocks = await this.repo.getBlocksByTemplateId(templateId);
await this.repo.createTemplate(userId, 'Turno Mañana', 'Descripción');
```
