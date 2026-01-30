import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { StreakService, type Streak, type HabitDebt } from '../services/streak.service';

export interface HabitsState {
  streaks: Streak[];
  debtedBlocks: HabitDebt[];
  loading: boolean;
}

export const HabitsStore = signalStore(
  { providedIn: 'root' },
  withState<HabitsState>({
    streaks: [],
    debtedBlocks: [],
    loading: false,
  }),
  withComputed((store) => ({
    totalStreaks: computed(() =>
      store.streaks().reduce((sum, s) => sum + s.currentCount, 0)
    ),
  })),
  withMethods((store, streakService = inject(StreakService)) => ({
    getStreakCount(blockName: string): number {
      return store.streaks().find((s) => s.blockName === blockName)?.currentCount ?? 0;
    },
    async loadStreaks(userId: string): Promise<void> {
      patchState(store, { loading: true });
      try {
        const streaks = await streakService.getStreaks(userId);
        patchState(store, { streaks, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
    addStreak(blockName: string, userId: string): void {
      const current = store.streaks();
      const existing = current.find((s) => s.blockName === blockName);
      const updated: Streak[] = existing
        ? current.map((s) =>
            s.blockName === blockName
              ? {
                  ...s,
                  currentCount: s.currentCount + 1,
                  longestCount: Math.max(s.longestCount, s.currentCount + 1),
                  lastCompleted: new Date().toISOString().split('T')[0],
                }
              : s
          )
        : [
            ...current,
            {
              id: crypto.randomUUID(),
              userId,
              blockName,
              currentCount: 1,
              longestCount: 1,
              lastCompleted: new Date().toISOString().split('T')[0],
              freezeCount: 2,
              freezeUsedThisMonth: 0,
            },
          ];
      patchState(store, { streaks: updated });
    },
  }))
);
