import { Injectable, inject } from '@angular/core';
import { SQLiteService } from '../../../core/database/sqlite.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { SyncService } from '../../../core/sync/sync.service';
import { NetworkService } from '../../../core/network/network.service';
import type { Template, Block, BlockCategory } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class TemplatesRepository {
  private sqlite = inject(SQLiteService);
  private supabase = inject(SupabaseService);
  private sync = inject(SyncService);
  private network = inject(NetworkService);

  async getTemplates(userId: string): Promise<Template[]> {
    if (this.network.isOnline()) {
      try {
        const { data, error } = await this.supabase
          .from('templates')
          .select('*')
          .eq('user_id', userId)
          .order('name');
        if (!error && data) {
          await this.cacheTemplates(userId, data as Template[]);
          return data as Template[];
        }
      } catch (e) {
        console.warn('Failed to fetch templates', e);
      }
    }
    if (!this.sqlite.db) return [];
    const result = await this.sqlite.db.query(
      'SELECT * FROM templates WHERE user_id = ? ORDER BY name',
      [userId]
    );
    return (result.values || []) as Template[];
  }

  async getBlocksByTemplateId(templateId: string): Promise<Block[]> {
    if (this.network.isOnline()) {
      try {
        const { data, error } = await this.supabase
          .from('blocks')
          .select('*')
          .eq('template_id', templateId)
          .order('start_time');
        if (!error && data) return data as Block[];
      } catch (e) {
        console.warn('Failed to fetch blocks', e);
      }
    }
    if (!this.sqlite.db) return [];
    const result = await this.sqlite.db.query(
      'SELECT * FROM blocks WHERE template_id = ? ORDER BY start_time',
      [templateId]
    );
    return (result.values || []) as Block[];
  }

  async createTemplate(userId: string, name: string, description?: string): Promise<Template> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const template: Template = {
      id,
      user_id: userId,
      name,
      description,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    if (this.sqlite.db) {
      await this.sqlite.db.run(
        `INSERT INTO templates (id, user_id, name, description, is_active, synced) VALUES (?, ?, ?, ?, 1, 0)`,
        [id, userId, name, description ?? null]
      );
      await this.sync.queueOperation({
        operation: 'INSERT',
        tableName: 'templates',
        recordId: id,
        payload: { ...template, is_active: true },
      });
    } else {
      const { error } = await this.supabase.from('templates').insert({
        id,
        user_id: userId,
        name,
        description: description ?? null,
        is_active: true,
      });
      if (error) throw error;
    }
    return template;
  }

  async addBlockToTemplate(
    templateId: string,
    name: string,
    startTime: string,
    endTime: string,
    options?: { description?: string; isCritical?: boolean; isShared?: boolean; category?: BlockCategory }
  ): Promise<Block> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const block: Block = {
      id,
      template_id: templateId,
      name,
      start_time: startTime,
      end_time: endTime,
      description: options?.description,
      is_critical: options?.isCritical ?? false,
      is_shared: options?.isShared ?? false,
      category: options?.category ?? 'work',
      created_at: now,
      updated_at: now,
    };
    if (this.sqlite.db) {
      await this.sqlite.db.run(
        `INSERT INTO blocks (id, template_id, name, start_time, end_time, description, is_critical, is_shared, category, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          id,
          templateId,
          name,
          startTime,
          endTime,
          block.description ?? null,
          block.is_critical ? 1 : 0,
          block.is_shared ? 1 : 0,
          block.category,
        ]
      );
      await this.sync.queueOperation({
        operation: 'INSERT',
        tableName: 'blocks',
        recordId: id,
        payload: block,
      });
    } else {
      const { error } = await this.supabase.from('blocks').insert({
        id,
        template_id: templateId,
        name,
        start_time: startTime,
        end_time: endTime,
        description: block.description ?? null,
        is_critical: block.is_critical,
        is_shared: block.is_shared,
        category: block.category,
      });
      if (error) throw error;
    }
    return block;
  }

  private async cacheTemplates(userId: string, templates: Template[]): Promise<void> {
    if (!this.sqlite.db) return;
    for (const t of templates) {
      await this.sqlite.db.run(
        `INSERT OR REPLACE INTO templates (id, user_id, name, description, is_active, synced) VALUES (?, ?, ?, ?, ?, 1)`,
        [t.id, t.user_id, t.name, t.description ?? null, t.is_active ? 1 : 0]
      );
    }
  }
}
