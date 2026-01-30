# Feature: Habits (rachas y deuda)

## Propósito

Sistema de rachas (streaks) y deuda de hábitos según gamificación científica (Atomic Habits, aversión a la pérdida). Estado global con NgRx Signals.

## Componentes principales

- Ninguno en esta carpeta; la racha se muestra en la vista "Hoy" (badge por bloque).

## Servicios y dependencias

- **StreakService**: I/O de rachas (SQLite en native; en web retorna vacío).
  - `getStreaks(userId)`: devuelve lista de rachas.
  - `loadStreaks(userId)`: carga y actualiza señales internas (legacy).
- **HabitsStore** (NgRx Signals): estado global de rachas y deuda.
  - Estado: `streaks`, `debtedBlocks`, `loading`.
  - Computed: `totalStreaks`.
  - Métodos: `loadStreaks(userId)`, `addStreak(blockName, userId)`, `getStreakCount(blockName)`.
- Depende de: `StreakService`, `SQLiteService`, `AnimationService`.

## Ejemplos de uso

```typescript
// En un componente
habitsStore = inject(HabitsStore);

await this.habitsStore.loadStreaks(userId);
const count = this.habitsStore.getStreakCount('Deep Work');
this.habitsStore.addStreak(blockName, userId);
```
