# Feature: Turnos de pareja

## Propósito

Calendario de turnos de pareja (mañana, tarde, doble, libre) por semana. Caso de uso: coordinar con pareja que tiene turnos rotativos.

## Componentes principales

- **TurnosComponent**: formulario para añadir/editar semana (inicio de semana, ID de pareja, tipo de turno), historial de turnos guardados.

## Servicios y dependencias

- **TurnScheduleRepository**: operaciones sobre `turn_schedule`.
  - `getByUser(userId)`, `getByWeek(userId, weekStart)`, `upsert(userId, partnerId, weekStart, turnType)`.
- Depende de: `SupabaseService`, `SQLiteService`, `NetworkService`.

## Ejemplos de uso

```typescript
private repo = inject(TurnScheduleRepository);

const list = await this.repo.getByUser(userId);
await this.repo.upsert(userId, partnerId, '2025-02-03', 'morning');
```
