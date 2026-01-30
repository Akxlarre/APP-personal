import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/auth/auth.service';
import { BlocksRepository } from '../../blocks/services/blocks.repository';
import { HabitsStore } from '../../habits/stores/habits.store';
import type { DailyBlock } from '../../../shared/models';

@Component({
  selector: 'app-hoy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="text-white text-xl font-semibold tracking-tight mb-4">Hoy</h2>
    @if (loading()) {
      <p class="text-white/40 text-sm">Cargando bloques...</p>
    } @else if (blocks().length === 0) {
      <div
        class="glass-card p-5 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md min-h-[88px] flex items-center hover:bg-zinc-800/50 hover:shadow-[0_0_15px_-5px_rgba(139,92,246,0.2)] transition-all"
      >
        <p class="text-white/60 text-sm m-0">
          No hay bloques para hoy. Aplica un template desde Templates.
        </p>
      </div>
    } @else {
      <div class="grid gap-4">
        @for (b of blocks(); track b.id) {
          <div
            class="glass-card p-4 rounded-2xl border min-h-[88px] flex flex-wrap items-center gap-3 transition-all"
            [class]="b.status === 'completed' ? 'border-emerald-500/40 bg-zinc-900/40 backdrop-blur-md' : 'border-white/5 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-800/50 hover:shadow-[0_0_15px_-5px_rgba(139,92,246,0.2)]'"
          >
            <span class="font-mono text-sm text-white/60 min-w-[100px] tabular-nums">
              {{ b.start_time }} - {{ b.end_time }}
            </span>
            <span class="flex-1 font-medium text-white">{{ b.name }}</span>
            @if (habitsStore.getStreakCount(b.name) > 0) {
              <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30">
                {{ habitsStore.getStreakCount(b.name) }} días
              </span>
            }
            @if (b.status === 'pending') {
              <button
                type="button"
                (click)="confirmBlock(b)"
                class="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 active:scale-95 transition-all"
              >
                Confirmar
              </button>
            } @else {
              <span class="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                Completado
              </span>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [` .glass-card { } `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoyComponent implements OnInit {
  private auth = inject(AuthService);
  private blocksRepo = inject(BlocksRepository);

  habitsStore = inject(HabitsStore);

  blocks = signal<DailyBlock[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadBlocks();
  }

  private async loadBlocks(): Promise<void> {
    const userId = this.auth.getUserId();
    if (!userId) return;
    await this.habitsStore.loadStreaks(userId);
    const today = new Date().toISOString().split('T')[0];
    const list = await this.blocksRepo.getDailyBlocks(userId, today);
    this.blocks.set(list);
    this.loading.set(false);
  }

  async confirmBlock(b: DailyBlock): Promise<void> {
    await this.blocksRepo.completeBlock(b.id, undefined);
    this.blocks.update((prev) =>
      prev.map((x) =>
        x.id === b.id ? { ...x, status: 'completed' as const } : x
      )
    );
    const userId = this.auth.getUserId();
    if (userId) this.habitsStore.addStreak(b.name, userId);
  }
}
