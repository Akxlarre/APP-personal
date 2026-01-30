import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { SQLiteService } from '../../../core/database/sqlite.service';
import { NetworkService } from '../../../core/network/network.service';
import type { SharedBlock } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class SharedBlocksRepository {
  private supabase = inject(SupabaseService);
  private sqlite = inject(SQLiteService);
  private network = inject(NetworkService);

  /**
   * Invitaciones recibidas (donde yo soy invited_user_id).
   */
  async getInvitationsForUser(userId: string): Promise<SharedBlock[]> {
    if (this.network.isOnline()) {
      try {
        const { data, error } = await this.supabase
          .from('shared_blocks')
          .select('*')
          .eq('invited_user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as SharedBlock[];
      } catch (e) {
        console.warn('Failed to fetch shared_blocks', e);
      }
    }
    if (!this.sqlite.db) return [];
    const result = await this.sqlite.db.query(
      'SELECT * FROM shared_blocks WHERE invited_user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return (result.values || []) as SharedBlock[];
  }

  /**
   * Bloques que yo compartí (owner_id = userId).
   */
  async getSharedByOwner(ownerId: string): Promise<SharedBlock[]> {
    if (this.network.isOnline()) {
      try {
        const { data, error } = await this.supabase
          .from('shared_blocks')
          .select('*')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as SharedBlock[];
      } catch (e) {
        console.warn('Failed to fetch shared_blocks', e);
      }
    }
    if (!this.sqlite.db) return [];
    const result = await this.sqlite.db.query(
      'SELECT * FROM shared_blocks WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    return (result.values || []) as SharedBlock[];
  }

  /**
   * Invitar a otro usuario a un bloque (template block).
   */
  async invite(blockId: string, ownerId: string, invitedUserId: string): Promise<SharedBlock> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const row: SharedBlock = {
      id,
      block_id: blockId,
      owner_id: ownerId,
      invited_user_id: invitedUserId,
      status: 'pending',
      confirmed_attendance: false,
      created_at: now,
      updated_at: now,
    };
    if (this.sqlite.db) {
      await this.sqlite.db.run(
        `INSERT INTO shared_blocks (id, block_id, owner_id, invited_user_id, status, confirmed_attendance, synced)
         VALUES (?, ?, ?, ?, 'pending', 0, 0)`,
        [id, blockId, ownerId, invitedUserId]
      );
    }
    const { error } = await this.supabase.from('shared_blocks').insert({
      id,
      block_id: blockId,
      owner_id: ownerId,
      invited_user_id: invitedUserId,
      status: 'pending',
      confirmed_attendance: false,
    });
    if (error) throw error;
    return row;
  }

  /**
   * Aceptar invitación.
   */
  async accept(id: string): Promise<void> {
    if (this.sqlite.db) {
      await this.sqlite.db.run(
        'UPDATE shared_blocks SET status = ? WHERE id = ?',
        ['accepted', id]
      );
    }
    const { error } = await this.supabase
      .from('shared_blocks')
      .update({ status: 'accepted' })
      .eq('id', id);
    if (error) throw error;
  }

  /**
   * Rechazar invitación.
   */
  async decline(id: string): Promise<void> {
    if (this.sqlite.db) {
      await this.sqlite.db.run(
        'UPDATE shared_blocks SET status = ? WHERE id = ?',
        ['declined', id]
      );
    }
    const { error } = await this.supabase
      .from('shared_blocks')
      .update({ status: 'declined' })
      .eq('id', id);
    if (error) throw error;
  }
}
