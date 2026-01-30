import { Injectable, inject } from '@angular/core';
import { SQLiteService } from '../../../core/database/sqlite.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { SyncService } from '../../../core/sync/sync.service';
import { NetworkService } from '../../../core/network/network.service';
import { TemplatesRepository } from '../../templates/services/templates.repository';
import type { DailyBlock, DailySchedule } from '../../../shared/models';

export type { DailyBlock };

@Injectable({ providedIn: 'root' })
export class BlocksRepository {
    private sqlite = inject(SQLiteService);
    private supabase = inject(SupabaseService);
    private sync = inject(SyncService);
    private network = inject(NetworkService);
    private templatesRepo = inject(TemplatesRepository);

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
                    await this.cacheBlocks(userId, date, data as DailyBlock[]);
                    return data as DailyBlock[];
                }
            } catch (error) {
                console.warn('Failed to fetch from server', error);
            }
        }

        if (!this.sqlite.db) {
            return [];
        }
        const result = await this.sqlite.db.query(
            `SELECT * FROM daily_blocks 
       WHERE user_id = ? AND date = ? 
       ORDER BY start_time ASC`,
            [userId, date]
        );

        return (result.values || []) as DailyBlock[];
    }

    async completeBlock(blockId: string, note?: string): Promise<void> {
        const completedAt = new Date().toISOString();
        if (this.sqlite.db) {
            await this.sqlite.db.run(
                `UPDATE daily_blocks 
                 SET status = 'completed', completion_note = ?, completed_at = ?, synced = 0, local_updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [note ?? null, completedAt, blockId]
            );
            await this.sync.queueOperation({
                operation: 'UPDATE',
                tableName: 'daily_blocks',
                recordId: blockId,
                payload: {
                    id: blockId,
                    status: 'completed',
                    completion_note: note,
                    completed_at: completedAt,
                },
            });
        } else {
            const { error } = await this.supabase
                .from('daily_blocks')
                .update({
                    status: 'completed',
                    completion_note: note,
                    completed_at: completedAt,
                })
                .eq('id', blockId);
            if (error) throw error;
        }
    }

    private async cacheBlocks(userId: string, date: string, blocks: DailyBlock[]): Promise<void> {
        if (!this.sqlite.db) return;
        for (const b of blocks) {
            await this.sqlite.db.run(
                `INSERT OR REPLACE INTO daily_blocks 
                 (id, schedule_id, original_block_id, user_id, date, name, start_time, end_time, status, completion_note, completed_at, synced)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                    b.id,
                    (b as any).schedule_id ?? null,
                    (b as any).original_block_id ?? null,
                    userId,
                    date,
                    b.name,
                    b.start_time,
                    b.end_time,
                    b.status,
                    b.completion_note ?? null,
                    b.completed_at ?? null,
                ]
            );
        }
    }

    /**
     * Aplica un template a una fecha: crea daily_schedule y daily_blocks.
     * @param userId - ID del usuario
     * @param templateId - ID del template
     * @param date - Fecha en formato YYYY-MM-DD
     * @returns Lista de bloques diarios creados
     */
    async applyTemplateToDay(userId: string, templateId: string, date: string): Promise<DailyBlock[]> {
        const blocks = await this.templatesRepo.getBlocksByTemplateId(templateId);
        if (blocks.length === 0) return [];

        const scheduleId = crypto.randomUUID();
        const schedulePayload: DailySchedule = {
            id: scheduleId,
            user_id: userId,
            date,
            template_id: templateId,
        };

        if (this.sqlite.db) {
            await this.sqlite.db.run(
                `INSERT INTO daily_schedule (id, user_id, date, template_id, synced) VALUES (?, ?, ?, ?, 0)`,
                [scheduleId, userId, date, templateId]
            );
            await this.sync.queueOperation({
                operation: 'INSERT',
                tableName: 'daily_schedule',
                recordId: scheduleId,
                payload: { ...schedulePayload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            });

            const created: DailyBlock[] = [];
            for (const b of blocks) {
                const blockId = crypto.randomUUID();
                const dbPayload = {
                    id: blockId,
                    schedule_id: scheduleId,
                    original_block_id: b.id,
                    user_id: userId,
                    date,
                    name: b.name,
                    start_time: b.start_time,
                    end_time: b.end_time,
                    status: 'pending',
                    synced: 0,
                };
                await this.sqlite.db.run(
                    `INSERT INTO daily_blocks (id, schedule_id, original_block_id, user_id, date, name, start_time, end_time, status, synced)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
                    [blockId, scheduleId, b.id, userId, date, b.name, b.start_time, b.end_time]
                );
                await this.sync.queueOperation({
                    operation: 'INSERT',
                    tableName: 'daily_blocks',
                    recordId: blockId,
                    payload: { ...dbPayload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                });
                created.push({
                    ...dbPayload,
                    schedule_id: scheduleId,
                    status: 'pending',
                    synced: 0,
                } as DailyBlock);
            }
            return created;
        }

        const { data: scheduleRow, error: scheduleError } = await this.supabase
            .from('daily_schedule')
            .insert({
                id: scheduleId,
                user_id: userId,
                date,
                template_id: templateId,
            })
            .select('id')
            .single();

        if (scheduleError || !scheduleRow) throw scheduleError ?? new Error('Failed to create daily_schedule');

        const inserted: DailyBlock[] = [];
        for (const b of blocks) {
            const blockId = crypto.randomUUID();
            const { data: row, error } = await this.supabase
                .from('daily_blocks')
                .insert({
                    id: blockId,
                    schedule_id: scheduleId,
                    original_block_id: b.id,
                    user_id: userId,
                    date,
                    name: b.name,
                    start_time: b.start_time,
                    end_time: b.end_time,
                    status: 'pending',
                })
                .select()
                .single();
            if (error) throw error;
            if (row) inserted.push(row as DailyBlock);
        }
        return inserted;
    }
}
