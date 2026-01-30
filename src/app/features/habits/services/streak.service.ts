import { Injectable, inject, signal, computed } from '@angular/core';
import { SQLiteService } from '../../../core/database/sqlite.service';
import { AnimationService } from '../../../core/animations/animation.service';

export interface Streak {
    id: string;
    userId: string;
    blockName: string;
    currentCount: number;
    longestCount: number;
    lastCompleted: string | null;
    freezeCount: number;
    freezeUsedThisMonth: number;
}

export interface HabitDebt {
    id: number;
    userId: string;
    blockId: string;
    blockName: string;
    originalDate: string;
    dueDate: string;
    status: 'pending' | 'completed' | 'forgiven';
}

const MILESTONES = [7, 14, 30, 50, 100, 365];
const MAX_FREEZE_PER_MONTH = 2;

@Injectable({ providedIn: 'root' })
export class StreakService {
    private sqlite = inject(SQLiteService);
    private animations = inject(AnimationService);

    streaks = signal<Streak[]>([]);
    debtedBlocks = signal<HabitDebt[]>([]);

    // Computeds
    totalStreaks = computed(() =>
        this.streaks().reduce((sum, s) => sum + s.currentCount, 0)
    );

    async loadStreaks(userId: string): Promise<void> {
        const result = await this.sqlite.db.query(
            'SELECT * FROM streaks WHERE user_id = ?',
            [userId]
        );
        this.streaks.set(result.values || []);
    }

    // Implementation details would go here as per SKILL.md
}
