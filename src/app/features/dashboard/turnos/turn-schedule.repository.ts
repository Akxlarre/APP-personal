import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { SQLiteService } from '../../../core/database/sqlite.service';
import { NetworkService } from '../../../core/network/network.service';
import type { TurnSchedule, TurnType } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class TurnScheduleRepository {
  private supabase = inject(SupabaseService);
  private sqlite = inject(SQLiteService);
  private network = inject(NetworkService);

  async getByUser(userId: string): Promise<TurnSchedule[]> {
    if (this.network.isOnline()) {
      try {
        const { data, error } = await this.supabase
          .from('turn_schedule')
          .select('*')
          .eq('user_id', userId)
          .order('week_start', { ascending: false });
        if (!error && data) return data as TurnSchedule[];
      } catch (e) {
        console.warn('Failed to fetch turn_schedule', e);
      }
    }
    if (!this.sqlite.db) return [];
    const result = await this.sqlite.db.query(
      'SELECT * FROM turn_schedule WHERE user_id = ? ORDER BY week_start DESC',
      [userId]
    );
    return (result.values || []) as TurnSchedule[];
  }

  async getByWeek(userId: string, weekStart: string): Promise<TurnSchedule | null> {
    const all = await this.getByUser(userId);
    return all.find((t) => t.week_start === weekStart) ?? null;
  }

  async upsert(
    userId: string,
    partnerId: string,
    weekStart: string,
    turnType: TurnType
  ): Promise<TurnSchedule> {
    const existing = await this.getByWeek(userId, weekStart);
    const now = new Date().toISOString();
    if (existing) {
      if (this.sqlite.db) {
        await this.sqlite.db.run(
          'UPDATE turn_schedule SET turn_type = ? WHERE id = ?',
          [turnType, existing.id]
        );
      }
      const { error } = await this.supabase
        .from('turn_schedule')
        .update({ turn_type: turnType })
        .eq('id', existing.id);
      if (error) throw error;
      return { ...existing, turn_type: turnType };
    }
    const id = crypto.randomUUID();
    const row: TurnSchedule = {
      id,
      user_id: userId,
      partner_id: partnerId,
      week_start: weekStart,
      turn_type: turnType,
      created_at: now,
      updated_at: now,
    };
    if (this.sqlite.db) {
      await this.sqlite.db.run(
        `INSERT INTO turn_schedule (id, user_id, partner_id, week_start, turn_type, synced)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [id, userId, partnerId, weekStart, turnType]
      );
    }
    const { error } = await this.supabase.from('turn_schedule').insert({
      id,
      user_id: userId,
      partner_id: partnerId,
      week_start: weekStart,
      turn_type: turnType,
    });
    if (error) throw error;
    return row;
  }
}
