import { Injectable, inject } from '@angular/core';
import { SQLiteService } from '../../../core/database/sqlite.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { SyncService } from '../../../core/sync/sync.service';
import { NetworkService } from '../../../core/network/network.service';

export interface DailyBlock {
    id: string;
    user_id: string;
    date: string;
    name: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'completed';
    completion_note?: string;
    completed_at?: string;
    synced: number;
    created_at?: string;
    updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class BlocksRepository {
    private sqlite = inject(SQLiteService);
    private supabase = inject(SupabaseService);
    private sync = inject(SyncService);
    private network = inject(NetworkService);

    async getDailyBlocks(userId: string, date: string): Promise<DailyBlock[]> {
        if (this.network.isOnline()) {
            try {
                const { data, error } = await this.supabase
                    .from('daily_blocks')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('date', date)
                    .order('start_time', { ascending: true });

                if (!error && data) {
                    // Cache logic would go here
                    return data as DailyBlock[];
                }
            } catch (error) {
                console.warn('Failed to fetch from server', error);
            }
        }

        // Fallback
        const result = await this.sqlite.db.query(
            `SELECT * FROM daily_blocks 
       WHERE user_id = ? AND date = ? 
       ORDER BY start_time ASC`,
            [userId, date]
        );

        return (result.values || []) as DailyBlock[];
    }
}
