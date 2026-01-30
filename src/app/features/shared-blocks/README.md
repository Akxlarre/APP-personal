# Feature: Shared Blocks (2 usuarios)

## Propósito

Coordinación entre dos usuarios: invitar a otro usuario a un bloque (template block), aceptar/rechazar invitaciones. Caso de uso: coordinar actividades con pareja.

## Componentes principales

- **SharedBlocksListComponent**: lista de invitaciones recibidas (aceptar/rechazar), bloques que compartí, formulario para invitar (bloque + ID del usuario invitado).

## Servicios y dependencias

- **SharedBlocksRepository**: operaciones sobre `shared_blocks`.
  - `getInvitationsForUser(userId)`, `getSharedByOwner(ownerId)`, `invite(blockId, ownerId, invitedUserId)`, `accept(id)`, `decline(id)`.
- Depende de: `SupabaseService`, `SQLiteService`, `NetworkService`.
- La UI usa además `TemplatesRepository` para listar bloques disponibles a compartir.

## Ejemplos de uso

```typescript
private sharedRepo = inject(SharedBlocksRepository);

const invitations = await this.sharedRepo.getInvitationsForUser(userId);
await this.sharedRepo.invite(blockId, ownerId, invitedUserId);
await this.sharedRepo.accept(sharedBlockId);
```
